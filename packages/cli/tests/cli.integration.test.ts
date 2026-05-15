import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";
import { describe, expect, it } from "vitest";

const pkgRoot = fileURLToPath(new URL("..", import.meta.url));
const cliDist = path.join(pkgRoot, "dist", "cli.js");

async function runCli(args: string[], cwd = pkgRoot) {
  return execa("node", [cliDist, ...args], { cwd, reject: false });
}

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
    const result = await runCli(["version", "--json"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    const payload = JSON.parse(result.stdout) as { ok: boolean; version: { releaseVersion: string } };
    expect(payload.ok).toBe(true);
    expect(typeof payload.version.releaseVersion).toBe("string");
  });

  it("returns JSON for check --json", async () => {
    const result = await runCli(["check", "--json"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    const payload = JSON.parse(result.stdout) as { ok: boolean; status: string };
    expect(payload.ok).toBe(true);
    expect(payload.status).toBe("manifest_present");
  });
});
