# usb.ids

<div align="center">

[![npm version](https://img.shields.io/npm/v/usb.ids)](https://www.npmjs.com/package/usb.ids) [![npm downloads](https://img.shields.io/npm/dm/usb.ids)](https://www.npmjs.com/package/usb.ids)

[![Upstream version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2Fusb.ids%2Fusb.ids.version.json&query=%24.upstreamVersion&label=upstream%20version&color=blue)](https://www.npmjs.com/package/usb.ids) [![Auto Update](https://img.shields.io/github/actions/workflow/status/Drswith/usb.ids/auto-update.yml?label=auto%20update)](https://github.com/Drswith/usb.ids/actions/workflows/auto-update.yml) [![GitHub Pages](https://img.shields.io/github/actions/workflow/status/Drswith/usb.ids/github-pages.yml?label=github%20pages)](https://github.com/Drswith/usb.ids/actions/workflows/github-pages.yml)

</div>

USB registry data and tools in an agent-first pnpm monorepo.  
Primary product surface is the `usb-ids` CLI; SDK and web are secondary consumers.

## Workspace Layout

- `packages/cli` — published package `usb.ids`, binary `usb-ids`, and CLI-owned data files (`usb.ids*`).
- `packages/sdk` — internal SDK source (Node/browser helpers and types), not published independently.
- `packages/web` — Vite search UI package, deployed to GitHub Pages.
- root — workspace orchestration, OpenSpec, governance docs/templates, CI/workflows.

## CLI (Primary)

Install:

```bash
npm install -g usb.ids
```

Core commands:

```bash
usb-ids fetch
usb-ids fetch --force
usb-ids fetch --force --interactive
usb-ids fetch --force --interactive --yes
usb-ids fetch --offline
usb-ids version
usb-ids version --json
usb-ids check
usb-ids check --json
usb-ids ui --port 3000
usb-ids help
```

Stable exit codes:

- `0` success
- `2` usage error
- `3` data missing
- `4` network failure
- `5` parse failure
- `6` filesystem failure

`version --json` and `check --json` write machine-readable JSON to `stdout` only.

## SDK (Secondary)

Programmatic access is exported from `usb.ids`:

```ts
import { getVendors, loadUsbData, searchInData } from "usb.ids";

const data = await loadUsbData();
const vendors = await getVendors();
const found = searchInData(data, "keyboard");
```

Browser-safe subpath:

```ts
import { filterVendors, searchInData } from "usb.ids/browser";
```

## Web

Local run:

```bash
pnpm --filter @usb-ids/web run dev
```

Build:

```bash
pnpm --filter @usb-ids/web run build
```

## Monorepo Development

Requirements: Node 18+, pnpm 9+.

```bash
pnpm install
pnpm run openspec:validate
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

Package-scoped examples:

```bash
pnpm --filter @usb-ids/sdk run test
pnpm --filter usb.ids run test
pnpm --filter @usb-ids/web run typecheck
```

## Data / Release Automation

- Auto-update workflow compares upstream `usb.ids` hash vs npm latest.
- When changed, workflow updates `packages/cli/usb.ids*`, builds workspace outputs, bumps `usb.ids` version, tags, and publishes.
- Local manual publish is not the source of truth; release remains workflow-owned.

## OpenSpec and Agent Assets

- Active migration change: `openspec/changes/agent-first-monorepo/`
- Agent instructions: `AGENTS.md`
- Shared reusable skills: `.agents/skills/`

## Docs

- [Architecture](docs/architecture.md)
- [API overview](docs/api.md)
- [Contributing](docs/contributing.md)
- [Migration v1 to v2](docs/migration-v1-to-v2.md)

## License

MIT — see [LICENSE](LICENSE).
