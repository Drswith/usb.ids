# Scripts

Utility scripts for CLI package automation and local maintenance.

## `diff-hash.ts`

Compares the SHA-256 of remote `usb.ids` with the latest published package’s `usb.ids.version.json` on the npm CDN (`upstreamHash`, or legacy `contentHash`). Used by GitHub Actions to skip no-op runs.

```bash
pnpm run diff-hash
# exit 0 → no update; exit 1 → run fetch / publish pipeline
```

## `build-artifacts.ts`

Runs after the CLI build. Reads package-local `usb.ids.json` (schema v2 or legacy v1 vendor map), writes under `dist/data/`:

- `usb.ids.min.json`, optional `.gz` / `.br`
- `usb.ids.compact.json`
- `vendors.index.json` and `vendors/<vid>.json`
- `usb.ids.version.json` (merged copy with `schemaVersion` and `artifacts` size metadata when a root version file exists)

```bash
pnpm run build   # includes build:artifacts
# or alone after lib build:
pnpm run build:artifacts
```

Requires `usb.ids.json` present in `packages/cli/` (run `pnpm run fetch-usb-ids` from repo root or package root).

## Adding scripts

1. TypeScript + `tsx` for execution.
2. Reuse shared SDK modules (workspace-relative imports under `packages/sdk/src`) instead of duplicating logic.
3. Add a `package.json` script and a short section here.
