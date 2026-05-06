# Contributing

## Prerequisites

- Node.js 18+
- pnpm (recommended; npm/yarn work for installing this package)

## Workflow

1. Fork and branch from `main`.
2. `pnpm install`
3. `pnpm run lint` and `pnpm run typecheck` before pushing.
4. `pnpm run test:coverage` — thresholds are defined in `vitest.config.ts` (line coverage on `src/**`, excluding CLI/utils glue where noted).

## Parser and fixtures

- Full-line parsing lives in `src/parser/full-usb-ids.ts`. Vendor blocks use indentation: vendor line → `\t` device → `\t\t` subsystem.
- **Regression tests:** add or extend snippets under `tests/fixtures/` (see `mini-usb.ids.ts`) so each major section (classes, AT, HID, HUT, languages, HCC, VT/HCT) stays covered without committing a multi-megabyte `usb.ids` solely for tests.
- For full-file behaviour, CI and local runs can use the repo-root `usb.ids` / `usb.ids.json` after `pnpm run fetch-usb-ids`.

## Commits and releases

- Human PRs: conventional commits are welcome.
- **npm releases** are automated by `.github/workflows/auto-update.yml` after a successful data update; local `pnpm run release` is intentionally blocked with a message to use that pipeline.

## UI (`app/`)

- Prefer DOM APIs and safe highlighting (`app/dom-safe.ts`) over `innerHTML` with user-controlled strings.
- Virtual list logic: `app/virtual-list.ts`.

If you add a script under `scripts/`, document it in `scripts/README.md` and wire an npm script when appropriate.
