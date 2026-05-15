# web-package Specification

## Purpose

TBD - created by archiving change agent-first-monorepo. Update Purpose after archive.

## Requirements

### Requirement: Dedicated Web Package

The web UI SHALL live in `packages/web` as a dedicated Vite workspace package.

#### Scenario: Developer starts the web app

- **WHEN** a developer runs the web package dev script
- **THEN** Vite serves the search UI from `packages/web`
- **THEN** the app uses workspace package imports or configured data URLs instead of root-relative internals

### Requirement: Web Build Uses Shared Contracts

The web UI SHALL consume shared query/browser helpers and generated data through package-level contracts.

#### Scenario: Web build runs in CI

- **WHEN** CI builds the web package
- **THEN** the build succeeds without importing files from root `src/`
- **THEN** browser-safe code paths do not include Node-only modules

### Requirement: GitHub Pages Workspace Deployment

The GitHub Pages workflow SHALL build and deploy the web package output from the monorepo workspace.

#### Scenario: Main branch deploys Pages

- **WHEN** a commit reaches `main`
- **THEN** the Pages workflow installs with pnpm
- **THEN** it builds `packages/web`
- **THEN** it uploads the web package output directory
