#!/usr/bin/env tsx

/**
 * Release planning for CI: compares the upstream USB.IDS content, the latest published
 * npm release manifest, and the checked-in CLI release manifest, then emits stage
 * decisions for the auto-update workflow.
 *
 * Output: human-readable by default, a single JSON object on stdout with `--json`.
 *
 * Decisions:
 *   - data_changed: upstream content hash differs from the checked-in manifest
 *     (or `--force`), so the fetch and version-bump stages are required.
 *   - publish_pending: the checked-in release version is not the published npm
 *     version, so the tag, changelog, and npm publish stages are required.
 *     Unreachable npm version info fails closed to pending.
 *   - run_pipeline: data_changed or publish_pending; gates build and artifacts.
 *
 * Exit codes:
 *   0 - plan computed; the decisions ride in the output.
 *   1 - upstream data unreachable, or the local manifest is unreadable.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import { fileURLToPath } from "node:url";
import { USB_IDS_SOURCE } from "../../sdk/src/config";
import { downloadFromUrls } from "../../sdk/src/fetcher";
import { generateContentHash } from "../../sdk/src/parser";
import { logger } from "../../sdk/src/utils";

interface NpmVersionInfo {
  upstreamHash?: string;
  contentHash?: string;
  releaseVersion?: string;
  version?: string;
}

interface LocalVersionInfo {
  releaseVersion?: string;
  upstreamHash?: string;
  contentHash?: string;
}

interface UpdatePlan {
  remote_hash: string;
  local_release: string | null;
  local_upstream_hash: string | null;
  npm_release: string | null;
  npm_hash: string | null;
  data_changed: boolean;
  publish_pending: boolean;
  run_pipeline: boolean;
}

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const force = args.includes("--force");

/** `--json` mode must keep stdout parseable: diagnostics go to stderr there. */
function log(level: "info" | "warn" | "success" | "error", message: string): void {
  if (asJson) {
    console.error(message);
    return;
  }
  logger[level](message);
}

function localManifestPath(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "usb.ids.version.json");
}

function readLocalManifest(): LocalVersionInfo | null {
  const manifestPath = localManifestPath();
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as LocalVersionInfo;
  } catch {
    return null;
  }
}

async function getRemoteContentHash(): Promise<string | null> {
  try {
    const content = await downloadFromUrls(USB_IDS_SOURCE);
    if (!content) return null;
    return generateContentHash(content);
  } catch (error) {
    log("warn", `Error downloading remote data: ${(error as Error).message}`);
    return null;
  }
}

async function getNpmVersionInfo(): Promise<NpmVersionInfo | null> {
  try {
    const versionUrl = "https://unpkg.com/usb.ids@latest/usb.ids.version.json";
    const response = await fetch(versionUrl);
    if (!response.ok) {
      log("warn", `Failed to fetch version info from unpkg: ${response.status}`);
      return null;
    }
    return (await response.json()) as NpmVersionInfo;
  } catch (error) {
    log("warn", `Error fetching npm version info: ${(error as Error).message}`);
    return null;
  }
}

async function buildPlan(): Promise<UpdatePlan | null> {
  const remoteHash = await getRemoteContentHash();
  if (!remoteHash) {
    log("error", "Failed to get remote content hash");
    return null;
  }
  log("info", `Remote content hash: ${remoteHash}`);

  const localRaw = readLocalManifest();
  const localRelease =
    typeof localRaw?.releaseVersion === "string" && localRaw.releaseVersion.trim() !== ""
      ? localRaw.releaseVersion.trim()
      : null;
  const localUpstreamHash =
    typeof localRaw?.upstreamHash === "string" && localRaw.upstreamHash.trim() !== ""
      ? localRaw.upstreamHash.trim()
      : typeof localRaw?.contentHash === "string" && localRaw.contentHash.trim() !== ""
        ? localRaw.contentHash.trim()
        : null;
  if (!localRaw) {
    log("warn", "No local release manifest found; planning a full data refresh");
  }
  log("info", `Local release: ${localRelease ?? "unknown"}`);
  log("info", `Local upstream hash: ${localUpstreamHash ?? "unknown"}`);

  const npmRaw = await getNpmVersionInfo();
  const npmRelease =
    typeof npmRaw?.releaseVersion === "string" && npmRaw.releaseVersion.trim() !== ""
      ? npmRaw.releaseVersion.trim()
      : typeof npmRaw?.version === "string" && npmRaw.version.trim() !== ""
        ? npmRaw.version.trim()
        : null;
  const npmHash = npmRaw?.upstreamHash ?? npmRaw?.contentHash ?? null;
  if (!npmRaw) {
    log("warn", "No npm version info available; failing closed to publish-pending");
  }
  log("info", `NPM release: ${npmRelease ?? "unknown"}`);
  log("info", `NPM hash: ${npmHash ?? "unknown"}`);

  const dataChanged = force || localUpstreamHash === null || remoteHash !== localUpstreamHash;
  // Unreachable npm info fails closed: publish so the run can verify against the registry.
  const publishPending = npmRelease === null || npmRelease !== localRelease;

  const plan: UpdatePlan = {
    remote_hash: remoteHash,
    local_release: localRelease,
    local_upstream_hash: localUpstreamHash,
    npm_release: npmRelease,
    npm_hash: npmHash,
    data_changed: dataChanged,
    publish_pending: publishPending,
    run_pipeline: dataChanged || publishPending,
  };

  log("info", `Data changed: ${plan.data_changed}`);
  log("info", `Publish pending: ${plan.publish_pending}`);
  log(
    plan.run_pipeline ? "info" : "success",
    plan.run_pipeline
      ? "Pipeline required"
      : "No pipeline work: data is current and npm matches the local release",
  );

  return plan;
}

async function main(): Promise<void> {
  log("info", force ? "Planning with force refresh" : "Planning auto-update stages");
  const plan = await buildPlan();
  if (!plan) {
    process.exit(1);
  }
  if (asJson) {
    process.stdout.write(`${JSON.stringify(plan)}\n`);
  }
}

main();
