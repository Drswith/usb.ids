# resume-auto-update-release

## Context

The auto-update workflow is a five-stage pipeline gated on a single boolean: `run_fetch` from `pnpm run diff-hash` (upstream content hash vs the hash published in the latest npm `usb.ids.version.json`). Once `run_fetch` is true, the run fetches, builds, commits, pushes `main`, pushes an annotated tag, generates the changelog release, and publishes to npm. The stages are strictly sequential with `set -e`, and none of them can be skipped.

On 2026-11-26 the tag push was rejected by GitHub with a bare `(failed)` reason (no `remote:` explanation, no ruleset or tag-protection rule involved, same `GITHUB_TOKEN` had pushed `main` seconds earlier; re-pushing the identical tag later succeeded immediately). Because the pipeline cannot skip completed stages, every recovery path currently fails:

- Re-running the failed run re-fetches on the old head, commits again, and dies pushing `main` (non-fast-forward).
- Re-dispatching re-fetches unchanged data, commits a duplicate (only `buildTime` differs), and dies creating the tag (`already exists`, exit 128).

The same step also failed transiently on 2026-06-14. The structural problem is not the transient GitHub failure itself but that a single failed stage after the `main` push wedges npm publication until a human untangles the repo.

## Goals / Non-Goals

**Goals:**

- A run whose data is already committed completes tagging, release notes, and npm publish without re-fetching or re-committing.
- Tag creation is idempotent: an existing tag at the expected commit is accepted; a tag pointing elsewhere is refused, never moved.
- Transient remote rejections of the tag push are retried before the run gives up.
- Planning decisions are machine-readable (`--json`) instead of exit-code only.
- `update_mode=auto|force|dry-run` semantics are preserved.

**Non-Goals:**

- No changes to CLI/SDK runtime contracts, package layout, or published artifact contents.
- No local publishing; npm publication stays workflow-owned with OIDC provenance.
- No new workflow jobs; the fix stays inside the existing `auto-update` job.
- `diff-hash` remains as-is for human/diagnostic use; it is not removed.

## Decisions

1. **Planning moves into `packages/cli/scripts/update-plan.ts` with `--json` output.** It computes, in one place: `remoteHash` (upstream content, same UTF-8-decode + SHA-256 as `diff-hash`), `npmRelease`/`npmHash` (unpkg `usb.ids@latest` manifest), and `localRelease`/`localUpstreamHash` (checked-in `packages/cli/usb.ids.version.json`). It emits booleans:
   - `data_changed` = force mode OR `remoteHash != localUpstreamHash` — gates fetch and commit.
   - `publish_pending` = `npmRelease != localRelease` (unreachable npm info fails closed to `true`, matching the old force-on-uncertainty behavior) — gates tag, changelog, publish.
   - `run_pipeline` = `data_changed` OR `publish_pending` — gates build and artifact upload.
   - Exit 0 when the plan is computed (decisions ride in the JSON); exit 1 only when the upstream is unreachable, so an upstream outage fails the run honestly instead of forcing a doomed pipeline.
   - Alternatives considered: keep exit-code-only `diff-hash` and infer resume state in bash (fragile, untestable); or add a separate "resume" dispatch mode (more surface area, and the daily schedule still could not self-heal).

2. **Stage gating in the workflow uses the plan outputs.** Fetch, and the version-bump commit run only when `data_changed`; build and artifact upload run whenever `run_pipeline` (npm publish packs from the working tree, so `dist` and regenerated data must exist even in resume mode); tag, changelog, and publish run when `publish_pending`. A fresh-data day, a resume day, and a post-publish rerun all resolve correctly under these definitions, and a steady no-change day keeps exiting as a no-op.

3. **The tag step becomes idempotent and retried.** Before creating anything it checks `git ls-remote --tags origin` for the tag: if present and peeled (`^{}`) to an ancestor of `HEAD` (releases outlive later commits landing on `main`, so the tag need not point at the head commit), it skips (already released); if present and pointing outside the current history, the step fails with an explicit message rather than moving a release tag. Otherwise it creates the annotated tag and pushes with up to 3 attempts and increasing sleeps, because the observed rejection class is transient and previously unhandled. `main` is pushed only when `data_changed` (a resume run has nothing new to push).

4. **The changelog step tolerates an existing GitHub release.** `gh release view "v$TAG_VERSION"` (with `GH_TOKEN`) short-circuits `changelogithub` when the release already exists, so a run that failed between release creation and npm publish can still complete the publish instead of dying on `already_exists`.

5. **In resume mode, regenerated `buildTime` stays uncommitted.** `pnpm run build` rewrites `usb.ids.version.json` with a fresh `buildTime`; the commit step is skipped, so the working-tree drift affects only the npm tarball metadata, not the repository. Accepted trade-off: the tarball's build timestamp is the resume time, the tagged manifest's is the original fetch time.

6. **Stale upstream mirrors must not produce downgrades.** The source list ends with a mirror (the systemd hwdb copy) that can lag months behind linux-usb.org; when the runner cannot reach the primary source, the fetcher silently falls back and the pipeline would derive an older CalVer from the mirror's `# Version` header (observed live: a runner fetched 2026-06-26 mirror data and resolved `2.20260626.0` against a released `2.20261125.0`; `pnpm publish` then no-op'd on the already-published version). Two guards close this: the plan script compares the remote `# Version` header with the checked-in `upstreamVersion` and forces `data_changed=false` with a visible warning when the remote view is older, so a pending release still completes from the committed state; and the version-bump step re-checks the resolved version against the head manifest, failing before commit — covering the window where the plan saw fresh data but the fetch fell back to the stale mirror. Alternative considered: removing the systemd source from the list; rejected because the mirror is still a correct fallback for fresh installs when linux-usb.org is unreachable, and the guard already makes it harmless.

## Risks / Trade-offs

- [Transient tag-push failures can still exhaust 3 retries] → The run fails and opens the notify-failure issue, but the next scheduled run now resumes cleanly instead of wedging; state converges within a day without human action.
- [npm publish is re-attempted when the npm manifest is unreachable] → Same fail-closed direction as the current `diff-hash` behavior; npm itself rejects duplicate versions, which fails the run loudly.
- [Bash-level JSON parsing] → Parsing is a single `node -e` read of the captured JSON; no `jq` dependency on the runner.
- [Local release older than npm (rolled-back main)] → npm rejects the publish; no special handling, out of scope.

## Migration Plan

1. Land the script + workflow change on `main` (single revertible commit; no rollout coordination needed).
2. Dispatch `Auto Update USB.IDS` with `update_mode=auto` to complete the pending `2.20261125.0` release (tag already on the remote; expected path: fetch/commit skipped, tag accepted as existing, changelog + publish run).
3. Verify `npm view usb.ids version` and the GitHub release, then close the auto-update failure issue.
4. Rollback: revert the commit; the workflow returns to exit-code-only gating.

## Open Questions

None. Force mode intentionally keeps unconditional refresh (`data_changed` forced true), matching its documented "always" semantics.
