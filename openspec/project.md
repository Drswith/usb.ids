# Project Context

`usb.ids` publishes USB ID registry data, a CLI, a Node/browser SDK surface, and a static search UI.

The repository is currently a single TypeScript package. The intended architecture is a pnpm monorepo with a CLI-first public contract:

- `packages/cli` keeps the existing `usb.ids` npm package name and `usb-ids` binary.
- `packages/sdk` provides secondary programmatic APIs as `@usb-ids/sdk`.
- `packages/web` builds and deploys the search UI.

Reusable agent-facing skills and instructions live under `.agents/` rather than `.codex/` so multiple agent runtimes can consume the same project guidance.

OpenSpec changes should preserve reproducible data artifacts, automated update/publish workflows, and backward compatibility for existing npm consumers where practical.
