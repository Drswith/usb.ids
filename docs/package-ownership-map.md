# Package Ownership Map (Issue #3)

This document audits the current repository layout and maps files to the target monorepo ownership defined by OpenSpec change `agent-first-monorepo`.

## Scope and method

- Audited current root structure: `src/`, `app/`, `tests/`, `scripts/`, root data files, root configs, docs, and workflows.
- Cross-checked against:
  - `openspec/changes/agent-first-monorepo/tasks.md`
  - `openspec/changes/agent-first-monorepo/design.md`
  - `openspec/changes/agent-first-monorepo/specs/*`
- Output targets:
  - `packages/cli` (primary product, `usb.ids` package + `usb-ids` binary)
  - `packages/sdk` (secondary Node/browser SDK, expected `@usb-ids/sdk`)
  - `packages/web` (Vite UI package)
  - root workspace orchestration (private, shared tooling/governance/release orchestration)

## Ownership map

| Current path(s) | Future owner | Reason / notes |
|---|---|---|
| `src/parser/**` | `packages/sdk` | Core parsing logic; reusable domain capability. |
| `src/fetcher/**` | `packages/sdk` | Shared network fetch layer used by SDK/service/scripts. |
| `src/pure/query.ts` | `packages/sdk` | Browser-safe query helpers shared by SDK and web. |
| `src/repository/file-store.ts` | `packages/sdk` | Reusable file persistence logic; avoid CLI-private duplication. |
| `src/service/usb-ids-data.ts` | `packages/sdk` | Fetch-parse-persist orchestration; consumed by CLI and Node API. |
| `src/types.ts` | `packages/sdk` | Shared schema and type contracts. |
| `src/errors.ts` | `packages/sdk` | Shared structured error contracts. |
| `src/legacy/to-v1.ts` | `packages/sdk` | Compatibility adapter used by Node API and web. |
| `src/manifest-ui.ts` | `packages/sdk` (browser-safe subpath) | UI uses it directly; should become browser-safe SDK helper/export. |
| `src/version-manifest.ts`, `src/calver.ts` | `packages/sdk` | Version/schema helpers are reusable; CLI consumes via SDK. |
| `src/api.ts`, `src/browser.ts` | `packages/sdk` | Public SDK entrypoints (Node + browser). |
| `src/index.ts` | split: SDK entry + CLI compatibility shim | Current root entry exports both API and CLI namespace; migrate to SDK entrypoint, keep CLI package compatibility exports only as transitional surface. |
| `src/node/data.ts`, `src/paths.ts` | split between SDK and CLI | Currently hard-coupled to package name `usb.ids` and root data file layout; needs explicit data source contract (OpenSpec task 3.4). |
| `src/config.ts` | split (`sdk` shared constants + `cli` runtime constants) | Contains both shared source URLs and CLI-local UI base/data filenames. |
| `src/cli.ts` | `packages/cli` | Primary command surface, binary runtime, local static server. |
| `usb.ids`, `usb.ids.json`, `usb.ids.version.json` | `packages/cli` | OpenSpec requires CLI-owned generated data artifacts. |
| `dist/data/*` output ownership | `packages/cli` | Build artifacts should follow CLI package ownership path. |
| `app/**` | `packages/web` | Entire web app implementation. |
| `public/**` | `packages/web` | Static web assets. |
| `index.html` | `packages/web` | Vite web app entry HTML. |
| `tests/api.test.ts`, `tests/parser.*.test.ts`, `tests/fetcher.test.ts`, `tests/hash.test.ts`, `tests/pure-query.test.ts`, `tests/version-manifest.test.ts`, `tests/errors.test.ts`, `tests/service.test.ts`, `tests/repository.test.ts`, `tests/index.test.ts`, `tests/legacy.to-v1.test.ts`, `tests/path-security.test.ts` | `packages/sdk` | SDK/unit-domain tests and parser/query/fetch behaviors. |
| `tests/api.browser.test.ts`, `tests/browser.smoke.test.ts` | `packages/sdk` | Browser entry contract tests for SDK package. |
| `tests/cli.test.ts` | `packages/cli` | CLI command behavior and stdout/stderr/exit-code contracts. |
| `tests/fixtures/mini-usb.ids.ts` | `packages/sdk` (shared fixture location if needed) | Primarily parser-focused fixture. |
| `tests/setup.ts` | root orchestration (or shared test config package) | Test harness glue consumed by multiple packages. |
| `app`-focused tests (future) | `packages/web` | Add after web package move, colocated with web package. |
| `scripts/build-artifacts.ts` | `packages/cli` (or CLI-owned internal script) | Produces CLI-owned data artifacts. |
| `scripts/diff-hash.ts` | root orchestration + CLI-aware | Workflow gate for publish/update; references published `usb.ids` state. |
| `scripts/README.md` | root orchestration | Repository-level operator docs, can reference package-scoped scripts. |
| `.github/workflows/auto-update.yml` | root orchestration | Repo-level release pipeline; must pivot to workspace package paths. |
| `.github/workflows/ci.yml` | root orchestration | Cross-workspace verification entrypoint. |
| `.github/workflows/github-pages.yml` | root orchestration | Repo-level deploy pipeline targeting web package build output. |
| `vite.config.ts` | `packages/web` (with shared config extraction if needed) | Web build config currently imports root `src/config` and root `package.json` version. |
| `tsdown.config.ts` | split (`packages/sdk` + `packages/cli`) | Currently builds SDK + CLI + browser from one root config; should be package-local. |
| `vitest.config.ts` | split (per-package + root orchestration script) | Current test projects span SDK and browser; CLI/web should own package-local configs. |
| `tsconfig.json`, `eslint.config.js` | root orchestration + per-package extends | Shared baseline at root, package-local includes/overrides. |
| `README.md`, `docs/api.md`, `docs/architecture.md`, `docs/contributing.md`, `docs/migration-v1-to-v2.md` | root orchestration docs with package-owned sections | Docs remain repo-level but must reflect CLI-first ownership and package paths. |
| `openspec/**`, `AGENTS.md`, `.agents/**`, `.github/ISSUE_TEMPLATE/**`, `.github/pull_request_template.md` | root orchestration | Governance and planning assets are repo-level, not package-level runtime code. |
| `package.json`, `pnpm-lock.yaml` (post-migration) | root orchestration | Root becomes private workspace orchestrator. |

## Disputed or split-required modules

The following modules currently cross boundaries and should be split/rewired before or during moves:

1. `src/config.ts`
   - Contains mixed concerns: source URLs (SDK-usable) + CLI-local file names/UI base.
   - Proposed split:
     - SDK: fetch-source defaults and schema-neutral constants.
     - CLI: local file ownership and UI serving base path.

2. `src/node/data.ts` + `src/paths.ts`
   - Hardcodes package name `usb.ids` and root data layout discovery.
   - Proposed split:
     - SDK API accepts explicit data root/path/url strategy.
     - CLI injects package-owned data root.

3. `src/index.ts`
   - Currently exports CLI namespace from main library entry.
   - Proposed split:
     - SDK package exposes SDK-only public API.
     - CLI package exposes binary + optional compatibility re-exports (time-limited).

4. `src/manifest-ui.ts`
   - Used by web UI but currently in root `src`.
   - Proposed action: move to SDK browser-safe helper export (or web-local copy if intentionally UI-specific).

5. `app/data-source.ts`
   - Imports `../src/config` directly (root coupling).
   - Proposed action: consume SDK/browser-safe constants/helpers or web-local config module.

6. `scripts/build-artifacts.ts`
   - Reads root `usb.ids.json` and writes root `dist/data`.
   - Proposed action: run against CLI package-owned data paths; avoid root-relative assumptions.

## Suggested migration order (for execution teams)

1. Freeze ownership contract using this map and keep moves path-only where possible.
2. Move SDK domain modules first (`parser/fetcher/pure/repository/service/types/errors/legacy/version helpers`) and keep API compatibility exports.
3. Introduce SDK data-source configuration boundary (`node/data` + `paths` refactor) before CLI data-file relocation.
4. Move CLI runtime (`src/cli.ts`) plus CLI-owned root data files and artifact build ownership.
5. Move web app (`app/`, `public/`, `index.html`, Vite config) and remove web imports from root `src/*`.
6. Split tests by package ownership and keep root orchestration commands running all packages.
7. Update workflows (`ci`, `auto-update`, `github-pages`) to workspace package paths.
8. Rewrite docs to CLI-first narrative with SDK secondary placement.

## Validation commands

Run from repository root, then package-filtered checks as packages appear:

```bash
pnpm run openspec:validate
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

Recommended package-focused validation during migration:

```bash
pnpm --filter ./packages/sdk... test
pnpm --filter ./packages/cli... test
pnpm --filter ./packages/web... build
```

CLI contract checks (post-CLI move):

```bash
pnpm --filter ./packages/cli... exec usb-ids help
pnpm --filter ./packages/cli... exec usb-ids version --json
pnpm --filter ./packages/cli... exec usb-ids check --json
```
