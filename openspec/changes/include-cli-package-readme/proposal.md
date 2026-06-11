# include-cli-package-readme

## Why

The published `usb.ids` npm package is now published from `packages/cli`, but the user-facing README only exists at the repository root. npm package pages render README content from the published package, so the current `usb.ids@2.20260610.0` tarball has no README and the npm page shows no package documentation.

## What Changes

- Add a CLI-first README to `packages/cli`, the package that owns the published `usb.ids` name.
- Explicitly include `README.md` in the CLI package file manifest.
- Restore the local `lint-staged` script entrypoint used by existing git hooks to run the current pnpm lint command.
- Validate the package tarball so the README appears in the published artifact.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `monorepo-packaging`: published CLI package artifacts include package documentation for npm consumers.
- `cli-primary-surface`: npm package documentation leads with CLI install and command usage.

## Impact

- Updates `packages/cli/README.md`.
- Updates `packages/cli/package.json`.
- Updates the root `package.json` hook compatibility script.
- Adds OpenSpec change artifacts for the packaging/documentation contract.
