# Design: standardize-cli-runtime

## Goals

1. Replace ad hoc CLI parsing/dispatch with a standard command framework.
2. Keep CLI-first behavior and existing machine contracts stable.
3. Add interactive capability without breaking automation.

## Non-Goals

- No command-surface redesign.
- No package publish model changes.
- No SDK API behavior changes.

## Decisions

### 1) Commander owns command graph and parsing

`commander` defines commands, aliases, and options for:

- `fetch` / `update`
- `version` / `info`
- `check`
- `ui`
- `help`

This removes manual switch-based argument routing.

### 2) Exit-code contract remains explicit

Business handlers continue returning the same stable exit-code set:

- `0` success
- `2` usage
- `3` data missing
- `4` network
- `5` parse
- `6` filesystem

Commander parsing errors are mapped to usage failure (`2`).

### 3) picocolors only for human output

Human-readable stdout/stderr messages use `picocolors`.
JSON mode (`--json`) still writes pure JSON to stdout with no decorative text.

### 4) prompts is opt-in and automation-safe

Interactive confirmation is only enabled for `fetch --force --interactive`.
`--yes` bypasses prompts. Non-interactive environments continue without prompts.

## Validation Plan

- CLI integration tests for help/unknown/version/check/fetch/ui behavior.
- Workspace validation: `openspec:validate`, `lint`, `typecheck`, `test`.
