# resume-auto-update-release

## Why

The `Auto Update USB.IDS` workflow cannot resume a half-completed release: when the data commit reaches `main` but the tag push is rejected (as happened on 2026-11-26, when GitHub transiently rejected `v2.20261125.0` with a bare `failed` reason), every subsequent run path fails — a re-dispatch dies on an existing tag or a duplicate data commit, and a failed-run rerun dies on a non-fast-forward `main` push — so npm publication stays blocked until a human intervenes.

## What Changes

- Gate fetch/commit on upstream-vs-local hash comparison (not upstream-vs-npm), so a run whose data is already committed skips re-fetching, re-building data artifacts, and re-committing.
- Publish whenever the local normalized release version is not yet the published npm version, so a run that previously failed after the data commit still completes tagging, changelog, and npm publish.
- Make the tag step resumable: skip creation when the tag already exists on the remote at the expected commit, refuse to move it when it points elsewhere, and retry the push on transient remote rejections.
- Replace the exit-code-only `diff-hash` planning step with a machine-readable plan (JSON output) consumed by the workflow.
- Keep `update_mode=auto|force|dry-run` semantics: `force` still refreshes data unconditionally; `dry-run` still never publishes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `monorepo-packaging`: extend the Automated Publishing Compatibility requirement so release automation is idempotent and resumable — data-current runs must not create duplicate data commits, existing release tags must not block completion, and npm publish must run whenever the local release version is ahead of the published one.

## Impact

- Updates `.github/workflows/auto-update.yml` (plan, fetch, build, artifact, commit, tag, changelog, publish gating).
- Adds a `packages/cli/scripts/update-plan.ts` planning script (JSON output) alongside the existing `diff-hash` script; `diff-hash` remains available for humans and unchanged for compatibility.
- No CLI, SDK, or web contract changes; no package layout changes.
