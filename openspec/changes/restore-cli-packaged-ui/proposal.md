# restore-cli-packaged-ui

## Why

Since the monorepo migration (#28), every published `usb.ids` npm release ships without `dist/ui`: the migration removed the root `build:app` step that built the web app into `dist/ui`, while the CLI `ui` command still resolves and serves `packages/cli/dist/ui` (pre-migration tarballs such as `1.0.1766044584391` contain a working `dist/ui`). As a result, `usb-ids ui` fails for every npm consumer with an error pointing to a command that no longer exists (`pnpm run build:app`), and nothing in the repository can produce `packages/cli/dist/ui` anymore. The packaged-UI contract that `packages/cli/src/cli.ts` (mount path `/__usb_ids__/`, data files served from the package root) and `packages/web/app/data-source.ts` (local-data mode keyed on that mount path) both still encode is currently unreachable.

## What Changes

- Add `packages/cli/scripts/pack-ui.ts` copying the built web output (`packages/web/dist`, produced with the CLI mount base `/__usb_ids__/`) into `packages/cli/dist/ui`, with a clear failure when the web build output is missing.
- Restore the root `build:app` script (web build + pack step) and chain it at the end of the root `build` script so CI, the auto-update pipeline, and npm publish all package the UI before artifacts are uploaded or published.
- Make the `ui` integration test conditional on `dist/ui` being absent, and add a serving test that runs when `dist/ui` is present, so local and CI runs both stay meaningful.
- Document the packaging path in the `usb-ids-app` agent skill.
- Re-release the npm package (CalVer patch bump, same data: `2.20261125.0` → `2.20261125.1`, matching the `2.20260610.0` → `2.20260610.1` packaging-fix precedent) via the auto-update workflow so the registry actually receives a tarball containing `dist/ui`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `monorepo-packaging`: add a packaged-web-UI requirement so the CLI package build and the automated publishing pipeline include `dist/ui`, and the published tarball serves the `ui` command without a repository checkout.

## Impact

- Adds `packages/cli/scripts/pack-ui.ts` and `packages/cli/tests/pack-ui.test.ts`.
- Updates the root `package.json` build scripts, `packages/cli/tests/cli.integration.test.ts`, and `.agents/skills/usb-ids-app/SKILL.md`.
- No workflow file changes: `auto-update.yml` already runs root `pnpm run build` before upload/publish.
- No SDK or web contract changes; `packages/web` only provides its existing build output.
