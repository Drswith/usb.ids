# repair-auto-update-publish

## Why

The `Auto Update USB.IDS` release workflow can currently enter a half-complete state: it may reuse the local fallback manifest during a forced release, derive a downgraded package version from a legacy manifest field, and then fail npm provenance validation because the published package metadata is incomplete.

## What Changes

- Repair the auto-update workflow so `workflow_dispatch` with `update_mode=force` actually invokes the CLI fetch path with `--force`.
- Fail closed unless a normalized `releaseVersion` is present after refresh, and derive tag creation from the updated package manifest instead of legacy manifest fallback.
- Add provenance-compatible repository metadata to the published `packages/cli/package.json`.
- Restore the checked-in CLI package version from the failed release attempt back to the currently published npm version before retrying release.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `monorepo-packaging`: tighten the auto-update publish workflow so forced releases refresh data correctly, use a monotonic release source, and include package metadata required by npm provenance validation.

## Impact

- Updates `.github/workflows/auto-update.yml`.
- Updates `packages/cli/package.json`.
- Updates OpenSpec packaging requirements for release automation.
