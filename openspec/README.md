# OpenSpec

OpenSpec is the planning and contract layer for non-trivial changes in this repository.

## Commands

```bash
pnpm run openspec:list
pnpm run openspec:status --change agent-first-monorepo
pnpm run openspec:validate
```

## Active Change

- `standardize-cli-runtime`: replace custom CLI routing with `commander` + common CLI tooling while preserving command contracts and exit-code stability.

## Agent Assets

Reusable OpenSpec skills live in `.agents/skills/` so the repository is not hard-coded to one agent vendor. Agent-specific adapters can reference those shared skills instead of duplicating them.

## Policy

- Create or update an OpenSpec change before implementing behavior, package-layout, CI, release, or public documentation changes.
- Keep `proposal.md`, `design.md`, capability specs, and `tasks.md` aligned.
- Archive completed changes only after specs are synced and validation passes.
