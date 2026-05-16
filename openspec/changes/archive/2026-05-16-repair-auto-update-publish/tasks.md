## 1. Workflow Repair

- [x] 1.1 Update the auto-update workflow so force mode forwards `--force` to the CLI fetch command.
- [x] 1.2 Require a normalized `releaseVersion` for publish/tag version resolution instead of falling back to the legacy manifest `version`.

## 2. Package Metadata

- [x] 2.1 Add provenance-compatible repository metadata to `packages/cli/package.json`.
- [x] 2.2 Restore the checked-in CLI package version from the failed release attempt back to the currently published npm version.

## 3. Validation And Recovery

- [x] 3.1 Run `pnpm run openspec:validate` and targeted workspace validation for the workflow/package changes.
- [x] 3.2 Re-trigger the release workflow and verify that npm publish succeeds.
