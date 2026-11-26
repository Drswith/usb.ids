# Design

## Context

- Pre-migration layout: one package; `build` chained `build:lib` → `build:artifacts` → `build:app --outDir dist/ui`, so `dist/ui` was part of every build and every npm tarball. The published tarball `1.0.1766044584391` proves it (`dist/ui/index.html`, `assets/*`, `linux.svg`, `robots.txt`, `sitemap.xml`).
- Post-migration: `packages/web` builds to `packages/web/dist`; `packages/cli` builds `dist/lib` + `dist/data`; nothing bridges the two, so `dist/ui` stopped existing. The CLI error message kept instructing `pnpm run build:app`, a script the migration deleted.
- The Pages base fix (`fix-web-pages-base-path`) restored `base: process.env.VITE_BASE_PATH || "/__usb_ids__/"`, so a no-env web build already produces exactly the mount path the CLI `ui` server serves and the app's local-data mode expects.

## Goals

1. One command from the repository root (`pnpm run build:app`) makes `usb-ids ui` work — matching the message the CLI already prints.
2. The automated pipeline (root `pnpm run build`) packages the UI with no extra workflow step, so uploads and npm publishes include `dist/ui` from now on.
3. The published npm package regains a working `ui` command, released through the repository's own workflow (no local publishing).

## Decisions

- `pack-ui.ts` copies rather than builds in place: the web package stays the sole owner of the Vite build; the CLI package owns its published layout (`dist/ui` inside the `files: ["dist"]` tree). The copy is a verbatim `fs.cpSync`, so the packaged UI is byte-identical to the web build.
- Root `build` chains `build:app` after the workspace-wide `pnpm -r build` instead of ordering it inside package builds: workspace builds of `packages/cli` and `packages/web` are independent (pnpm may run them in parallel), and a copy step must not depend on their interleaving. The redundant web rebuild inside `build:app` (~1–2 s) is the price of keeping `build:app` self-contained for the message printed by the CLI.
- `pack-ui` fails loudly (exit 1) when `packages/web/dist/index.html` is missing instead of silently shipping a UI-less tarball.
- Tag-stage git identity: the auto-update workflow configured `user.name`/`user.email` only inside the "Update package versions" step, which is gated on `data_changed`. The previously untested branch that creates a new tag while `data_changed=false` (exactly the packaging re-release and resume paths) died with "Committer identity unknown". The tag stage now sets its own identity before `git tag -a`, matching the identity the version-bump step already uses (`GitHub Action <action@github.com>`).
- Versioning for the npm re-release: CalVer patch bump on unchanged data (`2.20261125.1`), the same shape as the June packaging fix (`2.20260610.1`, same upstream hash, releaseVersion + package.json only). The bump is committed on `main` and published by dispatching the Auto Update workflow in `auto` mode: `update-plan` then reports `data_changed=false`, `publish_pending=true`, and the existing tag → changelog → npm publish stages complete the release with the new build output. A `force` dispatch alone cannot re-release: `publish_pending` is computed from the committed manifest before any fetch, so a force run would rebuild artifacts without tagging or publishing.
- Tests: `pack-ui` exports its function and only runs `main()` when executed directly, so a vitest file can exercise the copy logic with temp dirs; the CLI `ui` integration tests become conditional on `dist/ui` presence (missing-path test runs in CI where the CLI build alone produces no UI; serving-path test runs wherever `build:app` has run).

## Risks / Non-Goals

- Local runs of the CLI test suite after `build:app` now exercise the serving test (fixed port); CI keeps running only the missing-path test. Port collision on the fixed port fails the test loudly rather than silently.
- Re-publishing with a data-identical version is intentional: the registry state is the bug being fixed (tarball without `dist/ui`), and npm versions are immutable.
- Rebuilding `packages/web` twice during a full root build is accepted overhead.
- The `ui` error message text is unchanged on purpose: `pnpm run build:app` becomes a true statement again.
