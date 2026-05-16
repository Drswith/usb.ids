## Why

The successful `v2.20251213.0` auto-update release left `main` red because the generated `packages/cli/usb.ids.json` and `packages/cli/usb.ids.version.json` files did not satisfy the repository's `oxfmt` check. Manually reformatting the current release would fix one commit, but future auto-update runs would keep reintroducing the same CI failure.

## What Changes

- make the SDK JSON persistence helpers write repository-compatible JSON files with a trailing newline
- add regression coverage for the persisted JSON format
- reformat the current checked-in CLI JSON artifacts and archive this change after validation

## Impact

- future auto-update releases keep `main` green without manual cleanup commits
- package-local JSON artifacts remain machine-readable and formatter-compatible
