# monorepo-packaging Specification

## Purpose

TBD - created by archiving change agent-first-monorepo. Update Purpose after archive.

## Requirements

### Requirement: Pnpm Workspace Layout

The repository SHALL be organized as a pnpm monorepo with `packages/sdk`, `packages/cli`, and `packages/web` as workspace packages.

#### Scenario: Workspace packages are listed

- **WHEN** a contributor runs `pnpm -r list --depth -1`
- **THEN** the output includes the SDK package, CLI package, and web package
- **THEN** root orchestration remains separate from publishable package ownership

### Requirement: CLI Package Ownership

The `packages/cli` package SHALL own the published `usb.ids` npm package name, the `usb-ids` binary, generated data artifacts, and CLI documentation.

#### Scenario: User installs the primary package globally

- **WHEN** a user installs `usb.ids` globally from npm
- **THEN** the `usb-ids` command is available
- **THEN** the package documentation leads with CLI usage before SDK usage

### Requirement: Workspace Build Orchestration

Root scripts SHALL orchestrate lint, typecheck, test, build, and OpenSpec validation across workspace packages with pnpm.

#### Scenario: CI runs repository verification

- **WHEN** CI executes the root verification workflow
- **THEN** it installs with pnpm and runs workspace-aware lint, typecheck, test, build, and OpenSpec validation commands

### Requirement: Automated Publishing Compatibility

The auto-update workflow SHALL publish package artifacts from the correct workspace package paths after data refreshes.

#### Scenario: Upstream USB IDs data changes

- **WHEN** the auto-update workflow detects changed upstream data
- **THEN** it updates generated data in the CLI package ownership path
- **THEN** it builds all required package artifacts
- **THEN** it publishes the intended npm package or packages without relying on root package publication
