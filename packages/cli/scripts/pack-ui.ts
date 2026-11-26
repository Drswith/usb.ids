#!/usr/bin/env tsx

/**
 * Package the built web UI into `packages/cli/dist/ui` so the CLI `ui`
 * command and the published npm tarball can serve the search app at
 * `/__usb_ids__/` without a repository checkout.
 *
 * The source must be a web build made with the CLI UI mount base
 * (`/__usb_ids__/`, the no-env default of packages/web/vite.config.ts):
 *   pnpm --filter @usb-ids/web run build
 * or, from the repository root, the self-contained equivalent:
 *   pnpm run build:app
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(scriptDir, "..");
const defaultSource = path.resolve(cliRoot, "..", "web", "dist");
const defaultTarget = path.join(cliRoot, "dist", "ui");

export interface PackUiResult {
  /** Number of files written under the target directory. */
  fileCount: number;
  /** Absolute path of the packaged UI directory. */
  target: string;
}

function countFiles(dir: string): number {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count += countFiles(path.join(dir, entry.name));
    else if (entry.isFile()) count += 1;
  }
  return count;
}

export function packUi(source: string, target: string): PackUiResult {
  const sourceIndex = path.join(source, "index.html");
  if (!fs.existsSync(sourceIndex)) {
    throw new Error(
      `Missing ${sourceIndex} — build the web app first: pnpm --filter @usb-ids/web run build`,
    );
  }
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
  return { fileCount: countFiles(target), target };
}

function main(): void {
  const args = process.argv.slice(2);
  const readArg = (name: string): string | undefined => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const source = readArg("--source") ?? defaultSource;
  const target = readArg("--target") ?? defaultTarget;

  try {
    const { fileCount, target: packed } = packUi(source, target);
    const relTarget = path.relative(process.cwd(), packed) || packed;
    console.log(`Packaged web UI: ${fileCount} files -> ${relTarget}`);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
