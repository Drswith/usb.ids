#!/usr/bin/env tsx
/**
 * Build distributable data artefacts from repo-root usb.ids.json (schema v2).
 */
import type { UsbDatasetV2, UsbDeviceV2, UsbIdsData } from "../src/types";
import { Buffer } from "node:buffer";
import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import * as zlib from "node:zlib";
import { isDatasetV2 } from "../src/legacy/to-v1";

const root = process.cwd();
const srcPath = path.join(root, "usb.ids.json");
const versionPath = path.join(root, "usb.ids.version.json");
const outDir = path.join(root, "dist", "data");

function isV1VendorShape(x: unknown): x is UsbIdsData {
  if (typeof x !== "object" || x === null || Array.isArray(x)) return false;
  if ("schemaVersion" in x) return false;
  const entries = Object.entries(x as Record<string, unknown>);
  if (entries.length === 0) return false;
  const [, sample] = entries[0]!;
  return (
    typeof sample === "object" &&
    sample !== null &&
    "vendor" in sample &&
    "name" in sample &&
    "devices" in sample
  );
}

/** Legacy flat vendor JSON → v2 shell (classes/HID/etc. empty until full parse). */
function v1ToDatasetV2(data: UsbIdsData): UsbDatasetV2 {
  const vendors: UsbDatasetV2["vendors"] = {};
  for (const [vid, v] of Object.entries(data)) {
    const devices: Record<string, UsbDeviceV2> = {};
    for (const [did, d] of Object.entries(v.devices))
      devices[did] = { devid: d.devid, devname: d.devname };
    vendors[vid] = { vendor: v.vendor, name: v.name, devices };
  }
  return {
    schemaVersion: 2,
    vendors,
    classes: {},
    audioTerminals: {},
    hidDescriptors: {},
    hidItemTypes: {},
    biasTypes: {},
    phyTypes: {},
    hidUsagePages: {},
    languages: {},
    hidCountryCodes: {},
    videoTerminals: {},
    hcts: {},
  };
}

function readDataset(): UsbDatasetV2 {
  if (!fs.existsSync(srcPath)) {
    console.error(
      "Missing usb.ids.json — run pnpm run fetch-usb-ids or regenerate from usb.ids first.",
    );
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(srcPath, "utf8")) as unknown;
  if (isDatasetV2(raw)) return raw;
  if (isV1VendorShape(raw)) return v1ToDatasetV2(raw);
  console.error("usb.ids.json must be schema v2 or legacy v1 vendor map.");
  process.exit(1);
}

function main(): void {
  const dataset = readDataset();

  fs.mkdirSync(outDir, { recursive: true });

  const min = JSON.stringify(dataset);
  fs.writeFileSync(path.join(outDir, "usb.ids.min.json"), min);

  try {
    fs.writeFileSync(path.join(outDir, "usb.ids.min.json.gz"), zlib.gzipSync(min));
  } catch (e) {
    console.warn("gzip artefact skipped:", e);
  }

  try {
    fs.writeFileSync(
      path.join(outDir, "usb.ids.min.json.br"),
      zlib.brotliCompressSync(Buffer.from(min)),
    );
  } catch (e) {
    console.warn("brotli artefact skipped:", e);
  }

  const compact = [
    2,
    Object.entries(dataset.vendors).map(([vid, v]) => [
      vid,
      v.name,
      Object.entries(v.devices).map(([did, d]) => [
        did,
        d.devname,
        d.subsystems?.map((s) => [s.subvendor, s.subdevice, s.name]) ?? [],
      ]),
    ]),
  ] as const;
  fs.writeFileSync(path.join(outDir, "usb.ids.compact.json"), JSON.stringify(compact));

  const vendorIndex = Object.entries(dataset.vendors).map(([id, v]) => ({
    id,
    name: v.name,
    deviceCount: Object.keys(v.devices).length,
  }));
  fs.writeFileSync(path.join(outDir, "vendors.index.json"), JSON.stringify(vendorIndex));

  const vdir = path.join(outDir, "vendors");
  fs.mkdirSync(vdir, { recursive: true });
  for (const [vid, v] of Object.entries(dataset.vendors)) {
    fs.writeFileSync(
      path.join(vdir, `${vid}.json`),
      JSON.stringify({ vendor: v.vendor, name: v.name, devices: v.devices }),
    );
  }

  const stat = (rel: string) => {
    try {
      return fs.statSync(path.join(outDir, rel)).size;
    } catch {
      return undefined;
    }
  };

  const shardCount = Object.keys(dataset.vendors).length;
  const artifactsMeta = {
    "usb.ids.min.json": stat("usb.ids.min.json"),
    "usb.ids.min.json.gz": stat("usb.ids.min.json.gz"),
    "usb.ids.min.json.br": stat("usb.ids.min.json.br"),
    "usb.ids.compact.json": stat("usb.ids.compact.json"),
    "vendors.index.json": stat("vendors.index.json"),
    "vendors.shardCount": shardCount,
  };

  if (fs.existsSync(versionPath)) {
    try {
      const ver = JSON.parse(fs.readFileSync(versionPath, "utf8")) as Record<string, unknown>;
      ver.schemaVersion = dataset.schemaVersion;
      ver.artifacts = artifactsMeta;
      fs.writeFileSync(
        path.join(outDir, "usb.ids.version.json"),
        `${JSON.stringify(ver, null, 2)}\n`,
      );
    } catch (e) {
      console.warn("Could not write dist data version manifest:", e);
    }
  }

  console.log(`Artifacts written to ${outDir}`);
}

main();
