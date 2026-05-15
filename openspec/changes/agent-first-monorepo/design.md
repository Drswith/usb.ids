## Context

`usb.ids` currently ships one npm package that contains the CLI, Node API, browser entry, generated data files, and static UI build. The code already separates many logical layers (`src/parser`, `src/pure`, `src/node`, `src/service`, `src/cli.ts`, `app/`), but package ownership is implicit and root-centered.

The new structure should make the CLI the first-class product without throwing away existing SDK consumers. The safest migration is package-boundary first, then CLI contract hardening, then documentation and release updates.

## Goals / Non-Goals

**Goals:**

- Establish a pnpm workspace with `packages/cli`, `packages/sdk`, and `packages/web`.
- Keep the existing npm package name `usb.ids` attached to the CLI package so global installs remain intuitive.
- Introduce the SDK as a secondary package with explicit compatibility guidance.
- Make CLI behavior stable for agents: documented commands, JSON output, exit codes, and integration tests.
- Preserve reproducible generated data and the automated update/publish workflow.
- Give agents stable entry points through OpenSpec, `.agents/skills`, `AGENTS.md`, and GitHub templates.
- Track lint/format modernization as a distinct oxlint/oxfmt migration task rather than mixing it into source package moves.

**Non-Goals:**

- Do not redesign the USB data schema in this migration.
- Do not replace the existing parser/fetcher architecture unless package boundaries require small adapter changes.
- Do not add a fourth data-only package in this change; data ownership must fit inside the requested `sdk`, `cli`, and `web` packages.
- Do not remove current SDK compatibility until a documented deprecation window exists.

## Decisions

### Decision: Root becomes private workspace orchestration

The root `package.json` should become a private workspace package that owns scripts, shared dev dependencies, OpenSpec, and repository-level tooling. Publishing must move to package-level workflows.

Alternative considered: keep the root publishable and add packages beneath it. That preserves short-term compatibility but leaves the same root-first SDK bias and makes automated publish filtering more fragile.

### Decision: Shared agent skills live under `.agents`

Reusable OpenSpec skills should live under `.agents/skills` instead of `.codex/skills`. The repository can still support Codex, but project-owned agent instructions should not be hard-coded to one agent runtime when the goal is agent-first collaboration across tools.

Alternative considered: keep OpenSpec-generated skills in `.codex` and document them from `AGENTS.md`. That works for Codex only and makes other agents second-class.

### Decision: Oxc migration is planned as its own task

The current ESLint + Antfu/tooling setup should migrate to oxlint and oxfmt in a dedicated task. Use `pnpm dlx @oxlint/migrate eslint.config.js` only as a starting point, then reduce the output toward Oxc defaults and keep only repository-specific ignores or options.

Alternative considered: migrate linting while moving workspace config. That would combine package-boundary churn with formatting churn and make diffs harder to review.

### Decision: `packages/cli` owns `usb.ids`

The CLI package should keep the existing `usb.ids` package name and `usb-ids` binary. The package can expose compatibility exports that delegate to the SDK, but its README and package metadata should lead with CLI usage.

Alternative considered: publish the CLI as `@usb-ids/cli` and leave `usb.ids` as SDK. That is cleaner semantically but contradicts the requested CLI-first repositioning and makes `npm install -g usb.ids` harder to preserve.

### Decision: `packages/sdk` owns reusable parser/query/API code

The SDK package should contain parser, fetcher, pure query, repository helpers, Node/browser entrypoints, and public types. The CLI should consume SDK internals only through stable package exports or narrow internal workspace imports.

Alternative considered: duplicate parser/query logic in CLI and SDK. That would reduce coupling but increase data-format drift and test duplication.

### Decision: Data artifacts are CLI-owned, SDK-friendly

Generated root data artifacts should migrate under the CLI package because the CLI is the primary product and publish target. SDK APIs should support explicit data paths/URLs and, where compatibility requires it, the CLI package can re-export SDK helpers wired to its bundled data.

Alternative considered: put generated data in the SDK. That keeps old `loadUsbData()` simpler but makes the SDK the real product center again.

### Decision: Web package consumes published-like contracts

`packages/web` should import shared query/browser helpers from the SDK and fetch data through configured URLs or copied build artifacts. It should not depend on root-relative `src/` paths after migration.

Alternative considered: keep web code in root and only move CLI/SDK. That reduces the first move but leaves build and Pages workflow behavior outside the monorepo model.

## Risks / Trade-offs

- Package move churn can hide behavior changes. Mitigation: move files in small task-scoped PRs with tests and import-path-only commits where possible.
- Keeping `usb.ids` as the CLI package while maintaining SDK compatibility can blur ownership. Mitigation: docs and package metadata must lead with CLI, while compatibility exports are explicitly labeled transitional.
- Auto-update currently assumes root package paths. Mitigation: update CI/publish scripts only after package boundaries and build outputs are stable.
- Large generated data can be duplicated between packages. Mitigation: choose one owner (`packages/cli`) and make other packages consume configured data paths.
- Existing consumers may import `usb.ids` as a Node SDK. Mitigation: preserve imports initially and document migration to `@usb-ids/sdk`.
- Lint/format migration can create noisy mechanical diffs. Mitigation: keep oxlint/oxfmt migration separate, use a light config, and record validation before applying package moves.

## Migration Plan

1. Land OpenSpec, `.agents/skills`, `AGENTS.md`, and GitHub templates so future work has a shared contract.
2. Add pnpm workspace configuration and root orchestration while preserving current scripts.
3. Move SDK-owned code and tests into `packages/sdk`.
4. Move CLI runtime, binary metadata, data artifacts, and command tests into `packages/cli`.
5. Move Vite UI into `packages/web`.
6. Update docs and GitHub Actions to use workspace filters.
7. Harden CLI output/exit-code contracts and document SDK migration.
8. Validate full CI, auto-update dry-run, package build contents, and Pages build.

Rollback is branch-level before publication. After publishing package changes, rollback must keep `usb.ids` compatibility exports and release a forward fix rather than removing the monorepo layout abruptly.

## Open Questions

- Should `@usb-ids/sdk` be published immediately with the monorepo migration, or introduced as an internal workspace package first?
- What deprecation window is acceptable for Node SDK users importing from `usb.ids`?
- Should CLI JSON output be added before or after the package move? The tasks choose after initial CLI package ownership, but either order is viable if tests are clear.
