# standardize-cli-runtime

## Why

The current CLI command parser, routing, and help/error handling are custom-coded in one file. This makes command growth and option consistency harder, and creates avoidable maintenance cost for agent-driven changes.

## What Changes

- Refactor `packages/cli/src/cli.ts` to use `commander` for declarative command/option definitions and parsing.
- Use `picocolors` for standardized human-facing terminal output.
- Add `prompts` integration for optional interactive confirmation (`fetch --force --interactive`), while keeping non-interactive automation flows unchanged.
- Preserve existing command contracts (`fetch/update`, `version/info`, `check`, `ui`) and explicit exit codes.
- Keep JSON output behavior unchanged for `version --json` and `check --json`.

## Impact

- CLI internals become framework-driven and easier to extend.
- Scripted/agent usage remains stable (same commands and exit code contract).
- Human UX improves with consistent help/error rendering and opt-in interactive confirmation.
