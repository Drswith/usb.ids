# Design

## Context

- Pre-migration `vite.config.ts` resolved `base` as `env.VITE_BASE_PATH || UI_LOCAL_BASE_URL` (default `/__usb_ids__/`), and the Pages workflow passed `VITE_BASE_PATH=/usb.ids/`. Vite's `loadEnv` (verified against the pinned Vite 6.x in this workspace) sees process env vars, so the CI builds were correct before the migration.
- `packages/cli` serves the packaged UI at `http://localhost:<port>/__usb_ids__/` and serves `usb.ids.json` / `usb.ids.version.json` from the CLI package root under that same base. `packages/web/app/data-source.ts` switches to local data mode exactly when `import.meta.env.BASE_URL === "/__usb_ids__/"`. Both sides of this contract survived the migration; only the Vite base wiring was lost.

## Goals

1. Pages builds emit asset references under `/usb.ids/` so the deployed site executes.
2. No-env builds (local dev, or a future CLI-packaged `dist/ui`) keep the `/__usb_ids__/` base so the CLI `ui` server contract and local-data-mode detection stay coherent.
3. The base-path constant has a single definition shared by build config and app code.

## Decisions

- Read `process.env.VITE_BASE_PATH` directly instead of re-adopting `loadEnv`. `loadEnv` also sees process env on the pinned Vite, but a direct read is the narrower, more obvious dependency for one variable, and the current config already reads `process.env.VITE_DATA_PKG_VERSION` this way.
- Use `||` fallback semantics (matching pre-migration behavior) rather than `??`, so an explicitly empty value still falls back to the CLI mount path.
- Keep the shared constant in `packages/web/app/base-url.ts` (a module with no top-level `import.meta` access) so the Vite config — a Node context — can import it safely; `data-source.ts` cannot be imported from the config because it dereferences `import.meta.env` at module top level.

## Risks / Non-Goals

- Local `pnpm --filter @usb-ids/web run dev` now serves at `/__usb_ids__/` again and runs in local data mode. This is the pre-migration behavior; it matches the CLI `ui` contract, and the repo does not ship a dev-mode data file under `public/`. Re-pointing local dev at the npm CDN instead would silently orphan the CLI-served UI contract, so it is out of scope here.
- The orphaned `pnpm run build:app` hint inside the CLI `ui` error message is a pre-existing migration leftover; fixing that packaging step is out of scope for this change.
