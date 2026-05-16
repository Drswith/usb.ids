# cli-primary-surface Specification

## Purpose

TBD - created by archiving change agent-first-monorepo. Update Purpose after archive.

## Requirements

### Requirement: CLI First Documentation

The repository SHALL document CLI installation, command usage, and automation examples before Node SDK usage.

#### Scenario: User reads the README

- **WHEN** a user opens the README
- **THEN** CLI installation and core commands appear before SDK import examples
- **THEN** SDK usage is explicitly described as a secondary programmatic interface

### Requirement: Machine Readable CLI Output

The CLI SHALL provide JSON output for commands that report structured state.

#### Scenario: Agent checks version state

- **WHEN** an agent runs `usb-ids version --json`
- **THEN** stdout is valid JSON with release version, upstream version, counts, build time, and upstream hash fields
- **THEN** no decorative human log text is mixed into stdout

#### Scenario: Agent checks update state

- **WHEN** an agent runs `usb-ids check --json`
- **THEN** stdout is valid JSON describing local manifest state
- **THEN** missing manifest and parse failures produce explicit error objects or non-zero exits

### Requirement: Explicit Exit Codes

The CLI SHALL use stable exit codes for success, invalid usage, missing local data, fetch failures, parse failures, and filesystem failures.

#### Scenario: Invalid command is executed

- **WHEN** a user runs `usb-ids does-not-exist`
- **THEN** the process exits non-zero
- **THEN** stderr identifies the unknown command and points to help output

### Requirement: CLI Integration Tests

The repository SHALL include integration tests that execute the built CLI binary from package output.

#### Scenario: CI validates packaged CLI behavior

- **WHEN** CI runs CLI integration tests
- **THEN** tests invoke the built `usb-ids` binary
- **THEN** tests cover help, version, check, fetch dry-run or fixture mode, JSON output, and UI startup failure behavior

### Requirement: Standardized CLI Command Framework

The CLI SHALL use a declarative command framework for command registration, option parsing, and help/error rendering.

#### Scenario: Known command execution

- **WHEN** a user runs a supported command such as `usb-ids fetch --offline`
- **THEN** command routing is handled through framework-registered command handlers
- **THEN** the command returns the same explicit exit-code contract as before

#### Scenario: Unknown command execution

- **WHEN** a user runs `usb-ids does-not-exist`
- **THEN** the CLI reports an unknown-command usage error to stderr
- **THEN** process exit code is `2`

### Requirement: Optional Interactive Confirmation for Force Fetch

The CLI SHALL support optional interactive confirmation for force refresh while preserving non-interactive automation behavior.

#### Scenario: Interactive force fetch asks confirmation

- **WHEN** a user runs `usb-ids fetch --force --interactive` in an interactive terminal
- **THEN** the CLI prompts for confirmation before updating local data artifacts
- **THEN** `--yes` bypasses the prompt

#### Scenario: Automation flow remains non-interactive

- **WHEN** an agent or CI runs `usb-ids fetch --force` without `--interactive`
- **THEN** no prompt is shown
- **THEN** command execution remains scriptable and deterministic
