import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";
import { afterEach, describe, expect, it } from "vitest";

const pkgRoot = fileURLToPath(new URL("..", import.meta.url));
const cliDist = path.join(pkgRoot, "dist", "cli.js");
const tempDirs: string[] = [];

async function runCli(args: string[], cwd = pkgRoot) {
  return execa("node", [cliDist, ...args], { cwd, reject: false });
}

function writeFixtureData(cwd: string): void {
  fs.writeFileSync(
    path.join(cwd, "usb.ids.json"),
    JSON.stringify(
      {
        "1d6b": {
          vendor: "1d6b",
          name: "Linux Foundation",
          devices: {
            "0002": {
              devid: "0002",
              devname: "2.0 root hub",
            },
          },
        },
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(cwd, "usb.ids.version.json"),
    JSON.stringify(
      {
        releaseVersion: "2.20260515.0",
        upstreamVersion: "2025.09.10",
        upstreamDate: "2025-09-10",
        upstreamHash: "fixture-hash",
        schemaVersion: 2,
        buildTime: Date.now(),
        buildTimeFormatted: "2026-05-15 00:00:00 UTC",
        vendorCount: 1,
        deviceCount: 1,
      },
      null,
      2,
    ),
  );
}

function mkTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "usb-ids-cli-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const full = tempDirs.pop();
    if (!full) continue;
    try {
      fs.rmSync(full, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors in test teardown
    }
  }
});

describe("usb-ids cli integration (dist/cli.js)", () => {
  it("prints help", async () => {
    expect(fs.existsSync(cliDist)).toBe(true);
    const result = await runCli(["help"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("usb-ids <command> [options]");
    expect(result.stderr).toBe("");
  });

  it("exits usage code on unknown command", async () => {
    const result = await runCli(["not-a-command"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr.toLowerCase()).toContain("unknown command");
  });

  it("returns JSON for version --json", async () => {
    const cwd = mkTmpDir();
    writeFixtureData(cwd);
    const result = await runCli(["version", "--json"], cwd);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    const payload = JSON.parse(result.stdout) as {
      ok: boolean;
      version: { releaseVersion: string };
    };
    expect(payload.ok).toBe(true);
    expect(typeof payload.version.releaseVersion).toBe("string");
  });

  it("returns JSON for check --json", async () => {
    const cwd = mkTmpDir();
    writeFixtureData(cwd);
    const result = await runCli(["check", "--json"], cwd);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    const payload = JSON.parse(result.stdout) as { ok: boolean; status: string };
    expect(payload.ok).toBe(true);
    expect(payload.status).toBe("manifest_present");
  });

  it("supports fetch --offline fixture mode", async () => {
    const cwd = mkTmpDir();
    writeFixtureData(cwd);
    const result = await runCli(["fetch", "--offline"], cwd);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Data source: Local fallback file");
    expect(result.stderr).toBe("");
  });

  it("returns filesystem exit code for ui when dist/ui is missing", async () => {
    const result = await runCli(["ui", "--port", "3307"]);
    expect(result.exitCode).toBe(6);
    expect(result.stderr).toContain("dist/ui directory does not exist");
  });
});
