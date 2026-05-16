# Design: add-user-facing-app-skill

## Goals

1. Give users a direct repo-local skill for telling an agent how to use `usb.ids`.
2. Keep the product boundary clear: product usage goes through the CLI first, not SDK internals.
3. Make the skill discoverable from the root README with an explicit invocation prompt.

## Non-Goals

- No CLI command-surface changes.
- No SDK API additions or wrappers.
- No new vendor-specific skill copies outside `.agents/skills/`.

## Decisions

### 1) Add a single application skill under `.agents/skills/usb-ids-app`

This repository already contains maintainer workflow skills under `.agents/skills/openspec-*`. The missing piece is a product-facing skill. A single `usb-ids-app` skill keeps discovery simple and avoids splitting a small command surface across multiple skill folders.

### 2) The skill will be repo-local and package-aware

The CLI reads and writes package-local artifacts from `packages/cli`, not the repository root. The skill must tell agents to run product commands from `packages/cli` and to build the CLI before invoking `dist/cli.js` when needed.

### 3) The skill will prefer stable machine contracts

The skill should direct agents toward `version --json` and `check --json` for structured inspection, and explicitly document stable exit-code meanings. This keeps agent behavior aligned with the CLI-first standards already defined by the repository.

### 4) The web UI remains secondary in the skill

The skill may mention the web search UI, but only as a secondary path. In repository development contexts, the correct guidance is to use the web package dev server first and treat `usb-ids ui` as dependent on packaged UI assets.

## Risks / Trade-offs

- Skill guidance can drift from the CLI surface -> Keep the skill narrow and anchor examples to commands already documented in `README.md` and covered by CLI tests.
- A vague skill could push agents back toward the SDK -> State explicitly that SDK internals are not the starting point for product-use tasks.
- UI guidance can become misleading if packaging changes -> Document the current repository-development path and avoid promising that `ui` always works from an unbuilt checkout.
