import path from "node:path";
import { defineConfig } from "vite";
import { UI_LOCAL_BASE_URL } from "./app/base-url";

export default defineConfig(() => ({
  // Pages builds pass VITE_BASE_PATH=/usb.ids/; no-env builds keep the CLI
  // `ui` mount path so the packaged UI stays in local-data mode.
  base: process.env.VITE_BASE_PATH || UI_LOCAL_BASE_URL,
  resolve: {
    alias: {
      "@usb-ids/sdk/browser": path.resolve(__dirname, "../sdk/src/browser.ts"),
    },
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        target: "es2022",
        module: "esnext",
        moduleResolution: "bundler",
      },
    },
  },
  define: {
    "import.meta.env.VERSION": JSON.stringify(process.env.VITE_DATA_PKG_VERSION ?? "latest"),
  },
  build: {
    chunkSizeWarningLimit: 2048,
  },
}));
