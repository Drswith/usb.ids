# Contributing

## Prerequisites

- Node.js 18+
- pnpm 9+

## Workflow

1. Branch from `main`.
2. Run `pnpm install`.
3. Keep behavior/package/workflow changes aligned with OpenSpec (`openspec/changes/*`).
4. Validate before push:

```bash
pnpm run openspec:validate
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

## Package Ownership

- `packages/cli`: primary product (`usb-ids`), CLI-owned data files, CLI integration tests.
- `packages/sdk`: secondary SDK, parser/query/fetch/repository core, SDK unit tests.
- `packages/web`: web UI consumer of SDK browser/query contracts.

## CLI Contract Rules

- Keep CLI deterministic and scriptable.
- Prefer JSON output (`--json`) for structured state.
- Keep exit codes stable.
- Changes affecting command behavior require updated tests under `packages/cli/tests`.

## Data and Release

- Data update and npm publish are workflow-owned (`.github/workflows/auto-update.yml`).
- Do not rely on local manual publish as source of truth.

## Agent Assets

- Use `AGENTS.md` as the entry contract.
- Keep reusable skills under `.agents/skills/` (vendor-neutral).
