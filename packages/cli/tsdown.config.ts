import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: {
      cli: "src/cli.ts",
    },
    format: "esm",
    platform: "node",
    dts: false,
    clean: true,
    outDir: "dist",
  },
  {
    entry: {
      index: "src/sdk-compat.ts",
      browser: "src/browser-compat.ts",
      version: "src/version-compat.ts",
    },
    format: "esm",
    platform: "node",
    dts: true,
    clean: false,
    outDir: "dist",
  },
  {
    entry: {
      index: "src/sdk-compat.ts",
      version: "src/version-compat.ts",
    },
    format: "cjs",
    platform: "node",
    dts: false,
    clean: false,
    outDir: "dist",
  },
]);
