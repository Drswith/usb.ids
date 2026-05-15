# AGENTS.md

This repository publishes USB registry data and tools. Treat it as an agent-first project: every substantial change should be easy for an automated agent to discover, plan, run, test, and ship without relying on hidden human context.

## Product Priority

1. CLI: `usb-ids` is the primary user-facing product surface.
2. Data artifacts: generated `usb.ids`, `usb.ids.json`, `usb.ids.version.json`, and `dist/data/*` must remain reproducible.
3. Web UI: the browser app is a consumer of the same data and query contracts.
4. Node SDK: JavaScript APIs are secondary to the CLI and should not drive architecture decisions ahead of CLI usability.

## Repository Structure

Current package ownership:

- `packages/cli`: owns the published `usb.ids` package name and the `usb-ids` binary.
- `packages/sdk`: owns the secondary Node/browser SDK package, expected to publish as `@usb-ids/sdk`.
- `packages/web`: owns the Vite search UI and GitHub Pages build.
- root workspace: private pnpm monorepo orchestration, shared configs, OpenSpec, `.agents/` shared agent assets, and repository governance.

Do not move files across package boundaries ad hoc. Follow OpenSpec changes so package ownership, tests, exports, and workflows stay coherent.

## Required Workflow

- Start by checking `git status --short --branch` and reading relevant OpenSpec artifacts.
- For behavior, packaging, public API, or workflow changes, create or update an OpenSpec change under `openspec/changes/`.
- Keep reusable agent skills under `.agents/skills/`, not a single-vendor directory such as `.codex/`.
- Keep changes scoped to the active task. Avoid broad cleanups during package moves.
- Prefer pnpm commands in this repository.
- Do not publish locally. npm publication remains workflow-owned.

## Validation

Use the narrowest meaningful validation for the task, then broaden before closure:

```bash
pnpm run openspec:validate
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

For CLI changes, include command-level checks and assert exit codes/stdout shape. For web changes, run the Vite app or build and verify the rendered UI when feasible.

## CLI Standards

- CLI commands must be scriptable, deterministic, and documented.
- Add `--json` support for machine-readable output before relying on formatted human text.
- Use explicit non-zero exit codes for failures.
- Prefer stable command contracts over exposing internal SDK helpers.
- Keep Node SDK compatibility as a migration concern, not the primary design constraint.
