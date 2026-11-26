# fix-web-pages-base-path

## Why

The GitHub Pages site serves at the project path `https://drswith.github.io/usb.ids/`, but the deployed page references its bundle from the site root (`/assets/...`), which returns 404, so the app never boots: the version panel stays `-`, data never loads, and search is unavailable. The monorepo migration (#28, commit 0af98bf) rewrote `packages/web/vite.config.ts` without the `base` option, while the Pages workflow still passes `VITE_BASE_PATH=/usb.ids/` — the migration dropped the config half of an existing contract. npm `2.20261125.0` is already published; only the Pages deployment is broken.

## What Changes

- Restore Vite base wiring in the web package: `base` resolves from `VITE_BASE_PATH` (set to `/usb.ids/` by the Pages workflow) with the CLI UI mount path `/__usb_ids__/` as the no-env default, matching the pre-migration behavior.
- Extract the `UI_LOCAL_BASE_URL` constant into a tiny shared module consumed by both the Vite config and `app/data-source.ts`, so the CLI UI mount path and the local-data-mode detection cannot drift apart.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-package`: add a base path resolution requirement for web builds, and extend the GitHub Pages deployment requirement so the deployed build references assets under the Pages project base path.

## Impact

- `packages/web/vite.config.ts` (restore `base`), `packages/web/app/base-url.ts` (new shared constant), `packages/web/app/data-source.ts` (consume shared constant).
- No workflow changes: `.github/workflows/github-pages.yml` already sets `VITE_BASE_PATH: /usb.ids/`.
- No CLI or SDK contract changes; no npm publication involved.
