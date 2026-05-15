## Why

The repository currently mixes CLI, Node SDK, browser SDK, web UI, generated data, and release automation in one package. That shape makes agents optimize for the Node API first because it is the package root, while the actual desired product surface is the `usb-ids` CLI and its reproducible data workflows.

This change reframes `usb.ids` as an agent-first pnpm monorepo where the CLI is the primary supported interface, the SDK is secondary, and package boundaries make future automated work easier to plan, test, and release.

## What Changes

- **BREAKING repository layout change:** migrate from a single root package to a pnpm workspace with `packages/cli`, `packages/sdk`, and `packages/web`.
- Move the published `usb.ids` package name and `usb-ids` binary ownership to `packages/cli`.
- Introduce `packages/sdk` as the secondary Node/browser API package, expected to publish as `@usb-ids/sdk`.
- Move the Vite UI into `packages/web` and make it consume package-level data/query contracts instead of root-relative internals.
- Add OpenSpec as the required planning layer for public behavior, packaging, CI, and release changes.
- Store reusable OpenSpec agent skills under `.agents/skills/` instead of a Codex-specific `.codex/` directory.
- Add `AGENTS.md` plus common GitHub issue and PR templates so agent work starts from stable project instructions.
- Update docs, CI, Pages, and auto-update/publish workflows to use pnpm workspace filters.
- Plan a separate migration from the current ESLint + Antfu/formatting toolchain to oxlint + oxfmt with a light Oxc-default configuration.
- Preserve the current CLI command set during migration, then improve it with machine-readable output and explicit agent-oriented contracts.
- Keep Node SDK import compatibility as a migration concern, but stop treating the SDK as the first design driver.

## Capabilities

### New Capabilities

- `agent-governance`: agent-facing repository guidance, OpenSpec workflow, and GitHub contribution templates.
- `monorepo-packaging`: pnpm workspace package layout, package ownership, shared configs, and release/build orchestration.
- `cli-primary-surface`: CLI-first command contract, install behavior, output modes, and integration testing.
- `sdk-secondary-surface`: secondary SDK package exports, compatibility path, and docs demotion from primary product surface.
- `web-package`: dedicated web UI package, build inputs, and Pages deployment behavior.
- `tooling-migration`: repository lint and format tooling migration from ESLint/Antfu-style configuration to oxlint and oxfmt.

### Modified Capabilities

- None. This repository did not have existing OpenSpec capabilities before this change.

## Impact

- Root `package.json`, lockfile, workspace configuration, TypeScript/Vite/tsdown/Vitest/lint/format configs.
- Source layout currently under `src/`, `app/`, `tests/`, `scripts/`, `public/`, and generated data files.
- npm publication for the existing `usb.ids` package and any new scoped SDK package.
- GitHub Actions: CI, auto-update/publish, GitHub Pages.
- README, architecture/API/contributing docs, OpenSpec docs, AGENTS.md, `.agents/skills`, issue templates, and PR template.
