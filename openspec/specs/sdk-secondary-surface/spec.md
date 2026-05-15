# sdk-secondary-surface Specification

## Purpose

TBD - created by archiving change agent-first-monorepo. Update Purpose after archive.

## Requirements

### Requirement: Secondary SDK Package

The Node/browser SDK SHALL live in `packages/sdk` and be documented as a secondary programmatic interface behind the CLI.

#### Scenario: Developer needs programmatic access

- **WHEN** a developer reads SDK documentation
- **THEN** the documentation points to `@usb-ids/sdk`
- **THEN** it explains that CLI workflows remain the primary supported interface for automation

### Requirement: SDK Compatibility Path

The migration SHALL preserve existing `usb.ids` SDK imports during an explicit compatibility window or document a replacement path before removal.

#### Scenario: Existing consumer imports from `usb.ids`

- **WHEN** an existing Node consumer imports public helpers from `usb.ids`
- **THEN** the package continues to expose compatible helpers initially or provides a clear migration error with replacement guidance

### Requirement: SDK Data Source Configuration

The SDK SHALL support explicit data source configuration instead of assuming root package data paths.

#### Scenario: SDK consumer loads a custom dataset

- **WHEN** a consumer calls the SDK with an explicit local path or URL
- **THEN** the SDK loads that data source without requiring the CLI package to be installed globally

### Requirement: Public Type Stability

The SDK SHALL publish TypeScript types for parser output, query helpers, data loading, version manifests, and structured errors.

#### Scenario: TypeScript consumer installs the SDK

- **WHEN** a TypeScript project imports `@usb-ids/sdk`
- **THEN** the package resolves public type declarations without importing from internal workspace paths
