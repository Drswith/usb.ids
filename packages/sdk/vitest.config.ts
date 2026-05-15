import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/api.test.ts", "tests/api.browser.test.ts", "tests/paths.test.ts"],
  },
});
