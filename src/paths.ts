import * as fs from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Walk up from this module until we find this package's package.json (works for any dist layout).
 */
export function getPackageRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 12; i++) {
    const pkgPath = join(dir, "package.json");
    try {
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { name?: string };
        if (pkg.name === "usb.ids") {
          return dir;
        }
      }
    } catch {
      /* ignore */
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Could not resolve usb.ids package root (package.json not found)");
}
