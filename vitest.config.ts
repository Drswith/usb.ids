import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/cli.ts",
        "src/types.ts",
        "src/index.ts",
        "src/core.ts",
        "src/node/data.ts",
        "src/utils.ts",
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        branches: 68,
        functions: 78,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          include: ["tests/**/*.browser.test.{ts,js}"],
          name: "happy-dom",
          environment: "happy-dom",
        },
      },
      {
        extends: true,
        test: {
          include: ["tests/**/*.test.{ts,js}"],
          exclude: ["tests/**/*.browser.test.{ts,js}", "tests/**/*.bench.{ts,js}"],
          name: { label: "node", color: "green" },
          environment: "node",
        },
      },
    ],
  },
});
