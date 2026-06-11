## MODIFIED Requirements

### Requirement: Tooling Migration Validation

The migration SHALL update package scripts, lint-staged or hook configuration, CI guidance, and documentation to use oxlint and oxfmt.

#### Scenario: CI validates the migrated toolchain

- **WHEN** CI runs repository verification after the migration
- **THEN** lint and format checks use oxlint and oxfmt commands
- **THEN** stale ESLint/Antfu/format-plugin dependencies are removed from package manifests

#### Scenario: Contributor commits with an existing local hook

- **WHEN** a contributor has a local hook that invokes `npm run lint-staged`
- **THEN** the script delegates to the repository's pnpm lint workflow
- **THEN** the hook validates the current oxlint-based package checks
