## 1. UI Packaging Pipeline

- [x] 1.1 Add `packages/cli/scripts/pack-ui.ts` copying `packages/web/dist` into `packages/cli/dist/ui`, failing with a clear message (exit 1) when the web build output is missing, and exporting `packUi()` for tests with a direct-run guard for `main()`.
- [x] 1.2 Restore the root `build:app` script (web build + pack step) and chain it at the end of the root `build` script.
- [x] 1.3 Add `packages/cli/tests/pack-ui.test.ts` covering the happy path, recursive copying, target replacement, and the missing-source failure.

## 2. CLI UI Command Tests

- [x] 2.1 Make the `ui` missing-`dist/ui` integration test conditional so it only runs when `packages/cli/dist/ui` is absent.
- [x] 2.2 Add a conditional `ui` serving test for when `dist/ui` exists: assert `/` redirects to `/__usb_ids__/`, the page serves packaged HTML, and the package-root data files resolve under the mount path.

## 3. Agent Skill Documentation

- [x] 3.1 Update `.agents/skills/usb-ids-app/SKILL.md` UI Path section to document `pnpm run build:app` as the packaging step for `packages/cli/dist/ui`.

## 4. Validation

- [x] 4.1 Run `pnpm run build:app`, then command-level checks: `packages/cli/dist/ui/index.html` references `/__usb_ids__/` assets, and `node dist/cli.js ui` serves the packaged page and `usb.ids.json` over HTTP with expected status codes and exit behavior.
- [x] 4.2 Run `pnpm run openspec:validate` plus workspace lint, typecheck, format, and the CLI test suite.
- [x] 4.3 Commit the CalVer patch bump (`2.20261125.1`) for the packaging re-release and push to `main` with CI green.
- [x] 4.4 Fix the auto-update tag stage to configure its own git committer identity (the identity previously lived only in the data-gated version-bump step, so new-tag creation on `data_changed=false` paths failed with "Committer identity unknown").

## 5. npm Re-release

- [x] 5.1 Dispatch the Auto Update workflow in `auto` mode and verify it plans `data_changed=false`, `publish_pending=true`, then tags and publishes `2.20261125.1`.
- [x] 5.2 Verify the published tarball contains `dist/ui` (registry tarball listing or unpkg) and that the npm package's `usb.ids.version.json` releaseVersion matches the published version.
- [x] 5.3 Verify `npx usb-ids@2.20261125.1 ui` serves the packaged UI from the registry package.
