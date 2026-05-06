# Scripts

Utility scripts for automation and local maintenance.

## `diff-hash.ts`

Compares the SHA-256 content hash of remote `usb.ids` with the latest published package’s `usb.ids.version.json` on the npm CDN. Used by GitHub Actions to skip no-op runs.

```bash
pnpm run diff-hash
# exit 0 → no update; exit 1 → run fetch / publish pipeline
```

## `build-artifacts.ts`

Runs after the library build. Reads repo-root `usb.ids.json` (schema v2 or legacy v1 vendor map), writes under `dist/data/`:

- `usb.ids.min.json`, optional `.gz` / `.br`
- `usb.ids.compact.json`
- `vendors.index.json` and `vendors/<vid>.json`
- `usb.ids.version.json` (merged copy with `schemaVersion` and `artifacts` size metadata when a root version file exists)

```bash
pnpm run build   # includes build:artifacts
# or alone after lib build:
pnpm run build:artifacts
```

Requires `usb.ids.json` present (run `pnpm run fetch-usb-ids` or keep committed data).

## Adding scripts

1. TypeScript + `tsx` for execution.
2. Reuse `src/` modules (fetcher, parser, repository) instead of duplicating logic.
3. Add a `package.json` script and a short section here.
