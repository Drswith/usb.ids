import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig(() => ({
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
