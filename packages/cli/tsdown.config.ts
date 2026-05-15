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
    },
    format: "esm",
    platform: "node",
    dts: true,
    clean: false,
    outDir: "dist",
  },
]);
