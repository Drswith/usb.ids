## 1. Planning Script

- [x] 1.1 Add `packages/cli/scripts/update-plan.ts` computing remote hash, npm release/hash, and local manifest state, with `--json` machine-readable output and human-readable default output.
- [x] 1.2 Derive `data_changed`, `publish_pending`, and `run_pipeline` decisions in the script (force mode forces `data_changed`; unreachable npm info fails closed to `publish_pending`; unreachable upstream exits non-zero).
- [x] 1.3 Wire an `update-plan` script into `packages/cli/package.json`.

## 2. Workflow Resumability

- [x] 2.1 Replace the exit-code-only plan step in `.github/workflows/auto-update.yml` with `update-plan --json`, writing `data_changed`, `publish_pending`, and `run_pipeline` step outputs.
- [x] 2.2 Gate fetch and the version-bump commit on `data_changed`; gate build and artifact upload on `run_pipeline`; gate tag, changelog, and publish on `publish_pending`.
- [x] 2.3 Make the tag stage idempotent: accept an existing remote tag peeling to HEAD, fail explicitly when it peels elsewhere, push `main` only when `data_changed`, and retry the tag push a bounded number of times.
- [x] 2.4 Make the changelog stage skip when the GitHub release for the tag already exists (`gh release view` with `GH_TOKEN`).

## 3. Validation

- [x] 3.1 Run `pnpm run openspec:validate` plus workspace lint and typecheck.
- [x] 3.2 Run the CLI test suite and a targeted local invocation of `update-plan --json` against the pending `2.20261125.0` state, asserting `data_changed=false` and `publish_pending=true`.
- [ ] 3.3 Dispatch the auto-update workflow in `auto` mode, verify it completes the pending release (GitHub release + `npm view usb.ids version` reports `2.20261125.0`), and close the auto-update failure issue.
