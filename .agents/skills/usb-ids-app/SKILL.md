---
name: usb-ids-app
description: |
  Use this repository's `usb.ids` product through its primary CLI workflows instead of starting from SDK internals.
  Trigger when a user wants an agent to inspect local version/check state, refresh package-local USB ID data, or run the repo-backed search UI from this checkout.
---

# USB IDs App

Use this skill when the user wants an agent to operate `usb.ids` as a product from this repository checkout. If the user is asking to change repository code, workflow files, or specs, stop using this skill and switch back to the normal engineering workflow.

## Product Boundary

- Prefer the `usb-ids` CLI as the first-class interface.
- Do not start from `packages/sdk` unless the user explicitly asks for SDK or API behavior.
- Do not invent unsupported product commands. The current CLI surface is `fetch`, `version`, `check`, `ui`, and `help`.

## Working Directory And Command Form

The CLI reads and writes package-local artifacts from `packages/cli/`, including `usb.ids.json` and `usb.ids.version.json`. For product operations inside this repository, run commands from `packages/cli`.

If `packages/cli/dist/cli.js` does not exist yet, build the package first:

```bash
pnpm --filter usb.ids run build
```

Use the built CLI for product workflows:

```bash
pnpm --filter usb.ids exec node dist/cli.js <command>
```

## First Checks

Start with one of these:

```bash
pnpm --filter usb.ids exec node dist/cli.js help
pnpm --filter usb.ids exec node dist/cli.js version --json
pnpm --filter usb.ids exec node dist/cli.js check --json
```

Guidance:

- Prefer `version --json` or `check --json` when the user needs machine-readable state.
- Report `stdout` JSON directly in summarized form; do not mix decorative prose into the command output.
- If `version --json` or `check --json` fails because manifest files are missing, explain that the next step is `fetch`.

## Refresh Data

Refresh package-local data files:

```bash
pnpm --filter usb.ids exec node dist/cli.js fetch --offline
pnpm --filter usb.ids exec node dist/cli.js fetch --force
pnpm --filter usb.ids exec node dist/cli.js fetch --force --interactive --yes
```

Rules:

- `fetch --offline` reuses the local fallback file and avoids network access.
- `fetch --force` rewrites package-local artifacts in `packages/cli/`.
- Use `--interactive` only when the user wants a confirmation step. For normal automation, omit it.
- After a fetch, summarize release version, upstream version, vendor count, device count, and whether the source was local or remote.

## UI Path

There is no CLI search subcommand today. For interactive browsing, use the web UI.

For repository development, prefer the web package dev server:

```bash
pnpm --filter @usb-ids/web run dev
```

Only use the CLI UI command when `packages/cli/dist/ui` already exists:

```bash
pnpm --filter usb.ids exec node dist/cli.js ui --port 3000
```

If `ui` fails because `dist/ui` is missing, explain that this checkout does not currently have packaged UI assets and fall back to the web package dev server.

## Exit Codes

- `0`: success
- `2`: usage error
- `3`: data missing
- `4`: network failure
- `5`: parse failure
- `6`: filesystem failure

Use exit codes to distinguish an environment/setup problem from a product regression.

## Example Requests

- `Use $usb-ids-app to tell me the current release version and upstream version from this repository.`
- `Use $usb-ids-app to refresh the package-local data without network access and summarize the result.`
- `Use $usb-ids-app to start the repo's USB search UI and tell me which local URL to open.`
