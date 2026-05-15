import type { VersionInfo } from "../src/types";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadJsonFile,
  loadVersionInfo,
  saveUsbIdsToFile,
  saveVersionInfo,
} from "../src/repository/file-store";

describe("repository file-store", () => {
  let dir: string;

  afterEach(() => {
    if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  });

  it("saveVersionInfo round-trips", async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "usb-repo-"));
    const p = path.join(dir, "usb.ids.version.json");
    const v: VersionInfo = {
      releaseVersion: "2.20260101.0",
      upstreamVersion: "2026.01.01",
      upstreamDate: null,
      upstreamHash: "abc",
      schemaVersion: 2,
      buildTime: 1,
      buildTimeFormatted: "x",
      vendorCount: 1,
      deviceCount: 2,
    };
    await saveVersionInfo(v, p);
    expect(loadVersionInfo(p)).toEqual(v);
  });

  it("normalizes legacy manifest on load", async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "usb-repo-"));
    const p = path.join(dir, "usb.ids.version.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        fetchTime: 1,
        fetchTimeFormatted: "fmt",
        contentHash: "deadbeef",
        source: "api",
        vendorCount: 1,
        deviceCount: 2,
        version: "2.20260202.0",
      }),
    );
    expect(loadVersionInfo(p)).toEqual({
      releaseVersion: "2.20260202.0",
      upstreamVersion: "2026.02.02",
      upstreamDate: null,
      upstreamHash: "deadbeef",
      schemaVersion: 2,
      buildTime: 1,
      buildTimeFormatted: "fmt",
      vendorCount: 1,
      deviceCount: 2,
    });
  });

  it("loadJsonFile returns null for missing file", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "usb-repo-"));
    expect(loadJsonFile(path.join(dir, "nope.json"))).toBeNull();
  });

  it("saveUsbIdsToFile writes JSON", async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "usb-repo-"));
    const p = path.join(dir, "out.json");
    const data = { x: { vendor: "x", name: "N", devices: {} } };
    await saveUsbIdsToFile(data, p);
    const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
    expect(parsed).toEqual(data);
  });
});
