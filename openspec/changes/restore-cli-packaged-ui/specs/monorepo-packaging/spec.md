# monorepo-packaging Delta

## ADDED Requirements

### Requirement: Packaged Web UI

The CLI package build SHALL package the built web UI into `packages/cli/dist/ui` so the `usb-ids ui` command and the published npm tarball serve the search app at the CLI UI mount path without a repository checkout.

#### Scenario: Maintainer packages the UI

- **WHEN** a maintainer runs the root `build:app` script
- **THEN** the web package builds with the CLI UI mount base (`/__usb_ids__/`)
- **THEN** the build output is copied into `packages/cli/dist/ui`

#### Scenario: Automated build packages the UI

- **WHEN** the root build command runs in CI or the auto-update workflow
- **THEN** the packaged UI lands in `packages/cli/dist/ui` before artifacts are uploaded or npm publish runs

#### Scenario: Published tarball serves the UI command

- **WHEN** a user runs `usb-ids ui` from an npm-installed `usb.ids` package
- **THEN** the command serves the packaged UI at `/__usb_ids__/` with data files from the package root
- **THEN** the CLI does not require a repository checkout or a rebuild to start the server

#### Scenario: Pack step refuses a missing web build

- **WHEN** the pack step runs without a built `packages/web/dist/index.html`
- **THEN** it fails with a non-zero exit and a message naming the web build command to run first
