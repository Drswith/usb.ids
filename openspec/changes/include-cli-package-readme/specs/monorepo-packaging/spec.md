## MODIFIED Requirements

### Requirement: CLI Package Ownership

The `packages/cli` package SHALL own the published `usb.ids` npm package name, the `usb-ids` binary, generated data artifacts, and CLI documentation.

#### Scenario: User installs the primary package globally

- **WHEN** a user installs `usb.ids` globally from npm
- **THEN** the `usb-ids` command is available
- **THEN** the package documentation leads with CLI usage before SDK usage

#### Scenario: Maintainer previews the CLI package artifact

- **WHEN** a maintainer runs a dry-run package preview for `packages/cli`
- **THEN** the package contents include `README.md`
- **THEN** npm consumers can read CLI-first package documentation from the npm package page
