import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { packUi } from "../scripts/pack-ui";

const tempDirs: string[] = [];

function mkTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "usb-ids-pack-ui-"));
  tempDirs.push(dir);
  return dir;
}

function writeWebDist(source: string, extra: string): void {
  fs.mkdirSync(path.join(source, "assets"), { recursive: true });
  fs.writeFileSync(path.join(source, "index.html"), "<!doctype html>\n");
  fs.writeFileSync(path.join(source, "assets", "app.js"), "console.log('ok');\n");
  fs.writeFileSync(path.join(source, "assets", "app.css"), "body{}\n");
  fs.writeFileSync(path.join(source, "logo.svg"), extra);
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (!dir) continue;
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors in test teardown
    }
  }
});

describe("packUi", () => {
  it("copies a built web dist recursively into the target", () => {
    const source = mkTmpDir();
    const target = path.join(mkTmpDir(), "dist", "ui");
    writeWebDist(source, "<svg/>\n");

    const { fileCount } = packUi(source, target);

    expect(fileCount).toBe(4);
    expect(fs.readFileSync(path.join(target, "index.html"), "utf8")).toBe("<!doctype html>\n");
    expect(fs.readFileSync(path.join(target, "assets", "app.js"), "utf8")).toBe(
      "console.log('ok');\n",
    );
    expect(fs.readFileSync(path.join(target, "assets", "app.css"), "utf8")).toBe("body{}\n");
    expect(fs.readFileSync(path.join(target, "logo.svg"), "utf8")).toBe("<svg/>\n");
  });

  it("replaces previous target content instead of merging into it", () => {
    const source = mkTmpDir();
    const targetRoot = mkTmpDir();
    const target = path.join(targetRoot, "dist", "ui");
    writeWebDist(source, "<svg/>\n");
    fs.mkdirSync(path.join(target, "stale"), { recursive: true });
    fs.writeFileSync(path.join(target, "stale", "old.txt"), "stale\n");

    packUi(source, target);

    expect(fs.existsSync(path.join(target, "stale", "old.txt"))).toBe(false);
    expect(fs.existsSync(path.join(target, "index.html"))).toBe(true);
  });

  it("fails with a pointer to the web build when the source is missing", () => {
    const targetRoot = mkTmpDir();
    const missingSource = path.join(mkTmpDir(), "does-not-exist");

    expect(() => packUi(missingSource, path.join(targetRoot, "dist", "ui"))).toThrow(
      /build the web app first: pnpm --filter @usb-ids\/web run build/,
    );
    expect(fs.existsSync(path.join(targetRoot, "dist"))).toBe(false);
  });
});
