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
    expect(result.stdout).toContain("Usage: usb-ids");
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
    // Only meaningful when the packaged UI is absent (CI builds the CLI package
    // alone for tests); locally `pnpm run build:app` creates dist/ui and the
    // serving test below takes over instead.
    if (fs.existsSync(path.join(pkgRoot, "dist", "ui"))) return;
    const result = await runCli(["ui", "--port", "3307"]);
    expect(result.exitCode).toBe(6);
    expect(result.stderr).toContain("dist/ui directory does not exist");
  });

  it("serves the packaged ui over http when dist/ui exists", async () => {
    const uiDist = path.join(pkgRoot, "dist", "ui");
    if (!fs.existsSync(path.join(uiDist, "index.html"))) return;

    const port = 3319;
    const child = execa("node", [cliDist, "ui", "--port", String(port)], {
      cwd: pkgRoot,
      reject: false,
    });
    try {
      const base = `http://localhost:${port}/__usb_ids__/`;
      let redirectStatus = -1;
      let pageStatus = -1;
      let pageBody = "";
      let dataStatus = -1;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        try {
          const redirect = await fetch(`http://localhost:${port}/`, {
            redirect: "manual",
          });
          redirectStatus = redirect.status;
          const page = await fetch(base);
          pageStatus = page.status;
          pageBody = await page.text();
          const data = await fetch(`${base}usb.ids.json`);
          dataStatus = data.status;
          break;
        } catch {
          // server not accepting connections yet
        }
      }
      expect(redirectStatus).toBe(302);
      expect(pageStatus).toBe(200);
      expect(pageBody).toContain("<!doctype html>");
      expect(dataStatus).toBe(200);
    } finally {
      child.kill();
      await Promise.race([child, new Promise((resolve) => setTimeout(resolve, 2000))]).catch(
        () => undefined,
      );
    }
  });

  it("supports ESM import from usb.ids", async () => {
    const cwd = mkTmpDir();
    const nodeModules = path.join(cwd, "node_modules");
    const linkPath = path.join(nodeModules, "usb.ids");
    fs.mkdirSync(nodeModules, { recursive: true });
    fs.symlinkSync(pkgRoot, linkPath, "dir");
    const result = await execa(
      "node",
      [
        "--input-type=module",
        "-e",
        'import { parseUsbIds } from "usb.ids"; const d=parseUsbIds("0001  V\\n\\t0001  P\\n"); console.log(d && typeof d === "object" ? "ok" : "bad");',
      ],
      { cwd, reject: false },
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("ok");
  });

  it("supports CJS require from usb.ids", async () => {
    const cwd = mkTmpDir();
    const nodeModules = path.join(cwd, "node_modules");
    const linkPath = path.join(nodeModules, "usb.ids");
    fs.mkdirSync(nodeModules, { recursive: true });
    fs.symlinkSync(pkgRoot, linkPath, "dir");
    const result = await execa(
      "node",
      [
        "-e",
        'const m=require("usb.ids"); console.log(typeof m.parseUsbIds === "function" ? "ok" : "bad");',
      ],
      { cwd, reject: false },
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("ok");
  });

  it("supports browser and version subpath imports", async () => {
    const cwd = mkTmpDir();
    const nodeModules = path.join(cwd, "node_modules");
    const linkPath = path.join(nodeModules, "usb.ids");
    fs.mkdirSync(nodeModules, { recursive: true });
    fs.symlinkSync(pkgRoot, linkPath, "dir");
    const result = await execa(
      "node",
      [
        "--input-type=module",
        "-e",
        'import { filterVendors } from "usb.ids/browser"; import { version } from "usb.ids/data/version"; const versionStr = typeof version.releaseVersion === "string" ? version.releaseVersion : version.version; const ok = typeof filterVendors === "function" && typeof versionStr === "string"; console.log(ok ? "ok" : "bad");',
      ],
      { cwd, reject: false },
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("ok");
  });
});
