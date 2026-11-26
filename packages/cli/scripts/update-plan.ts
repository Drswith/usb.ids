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
 *   - stale_source: the upstream view carries an older `# Version` header than the
 *     checked-in manifest (e.g. a lagging fallback mirror served the data). The run
 *     must not derive a downgrade from it, so data_changed is forced false and a
 *     pending release still completes from the committed state.
 *
 * Exit codes:
 *   0 - plan computed; the decisions ride in the output.
 *   1 - upstream data unreachable.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import { fileURLToPath } from "node:url";
import { USB_IDS_SOURCE } from "../../sdk/src/config";
import { downloadFromUrls } from "../../sdk/src/fetcher";
import { generateContentHash, parseUsbIdsHeader } from "../../sdk/src/parser";
import { logger } from "../../sdk/src/utils";

interface NpmVersionInfo {
  upstreamHash?: string;
  contentHash?: string;
  releaseVersion?: string;
  version?: string;
}

interface LocalVersionInfo {
  releaseVersion?: string;
  upstreamVersion?: string;
  upstreamHash?: string;
  contentHash?: string;
}

interface UpdatePlan {
  remote_hash: string;
  remote_upstream_version: string | null;
  local_release: string | null;
  local_upstream_version: string | null;
  local_upstream_hash: string | null;
  npm_release: string | null;
  npm_hash: string | null;
  data_changed: boolean;
  publish_pending: boolean;
  run_pipeline: boolean;
  stale_source: boolean;
}

const DOTTED_VERSION_RE = /^\d{4}\.\d{2}\.\d{2}$/;

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

/** Numeric comparison of dotted `YYYY.MM.DD` version headers. */
function compareDottedVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
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

function trimmed(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

async function getRemoteContent(): Promise<{ hash: string; version: string | null } | null> {
  try {
    const content = await downloadFromUrls(USB_IDS_SOURCE);
    if (!content) return null;
    return { hash: generateContentHash(content), version: parseUsbIdsHeader(content).version };
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
  const remote = await getRemoteContent();
  if (!remote) {
    log("error", "Failed to download remote USB.IDS data");
    return null;
  }
  log("info", `Remote content hash: ${remote.hash}`);
  log("info", `Remote upstream version: ${remote.version ?? "unknown"}`);

  const localRaw = readLocalManifest();
  const localRelease = trimmed(localRaw?.releaseVersion);
  const localUpstreamHash = trimmed(localRaw?.upstreamHash) ?? trimmed(localRaw?.contentHash);
  const localUpstreamVersion = trimmed(localRaw?.upstreamVersion);
  if (!localRaw) {
    log("warn", "No local release manifest found; planning a full data refresh");
  }
  log("info", `Local release: ${localRelease ?? "unknown"}`);
  log("info", `Local upstream hash: ${localUpstreamHash ?? "unknown"}`);
  log("info", `Local upstream version: ${localUpstreamVersion ?? "unknown"}`);

  const npmRaw = await getNpmVersionInfo();
  const npmRelease = trimmed(npmRaw?.releaseVersion) ?? trimmed(npmRaw?.version);
  const npmHash = trimmed(npmRaw?.upstreamHash) ?? trimmed(npmRaw?.contentHash);
  if (!npmRaw) {
    log("warn", "No npm version info available; failing closed to publish-pending");
  }
  log("info", `NPM release: ${npmRelease ?? "unknown"}`);
  log("info", `NPM hash: ${npmHash ?? "unknown"}`);

  // A lagging fallback mirror must never drive a version downgrade: when the upstream
  // view is older than what is already checked in, treat the data as current.
  const staleSource =
    localUpstreamVersion !== null &&
    remote.version !== null &&
    DOTTED_VERSION_RE.test(localUpstreamVersion) &&
    DOTTED_VERSION_RE.test(remote.version) &&
    compareDottedVersions(remote.version, localUpstreamVersion) < 0;

  const dataChanged =
    !staleSource && (force || localUpstreamHash === null || remote.hash !== localUpstreamHash);
  if (staleSource) {
    log(
      "warn",
      `Remote upstream view ${remote.version} is older than the local ${localUpstreamVersion}; refusing a data refresh from it`,
    );
  }

  // Unreachable npm info fails closed: publish so the run can verify against the registry.
  const publishPending = npmRelease === null || npmRelease !== localRelease;

  const plan: UpdatePlan = {
    remote_hash: remote.hash,
    remote_upstream_version: remote.version,
    local_release: localRelease,
    local_upstream_version: localUpstreamVersion,
    local_upstream_hash: localUpstreamHash,
    npm_release: npmRelease,
    npm_hash: npmHash,
    data_changed: dataChanged,
    publish_pending: publishPending,
    run_pipeline: dataChanged || publishPending,
    stale_source: staleSource,
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
