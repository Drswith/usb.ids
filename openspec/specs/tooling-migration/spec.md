# tooling-migration Specification

## Purpose
TBD - created by archiving change agent-first-monorepo. Update Purpose after archive.
## Requirements
### Requirement: Oxc Lint And Format Toolchain

The repository SHALL migrate from the current ESLint + Antfu/formatting toolchain to oxlint and oxfmt.

#### Scenario: Contributor runs lint

- **WHEN** a contributor runs the repository lint command after the migration
- **THEN** oxlint checks the workspace source files
- **THEN** the command does not require ESLint or `@antfu/eslint-config`

#### Scenario: Contributor runs format check

- **WHEN** a contributor runs the repository format-check command after the migration
- **THEN** oxfmt verifies formatting for supported workspace files
- **THEN** the command does not require Prettier-style formatting through ESLint plugins

### Requirement: Light Oxc Default Configuration

The Oxc migration SHALL keep configuration minimal and close to Oxc defaults.

#### Scenario: Migration config is reviewed

- **WHEN** a reviewer opens the oxlint and oxfmt configuration files
- **THEN** the files contain only repository-specific ignores, environment/plugin needs, or formatting options
- **THEN** migrated legacy ESLint or Prettier settings are not preserved unless they are intentionally required

### Requirement: Tooling Migration Validation

The migration SHALL update package scripts, lint-staged or hook configuration, CI guidance, and documentation to use oxlint and oxfmt.

#### Scenario: CI validates the migrated toolchain

- **WHEN** CI runs repository verification after the migration
- **THEN** lint and format checks use oxlint and oxfmt commands
- **THEN** stale ESLint/Antfu/format-plugin dependencies are removed from package manifests

