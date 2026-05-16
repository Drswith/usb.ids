# add-user-facing-app-skill

## Why

The repository is positioned as agent-first, but today it only exposes maintainer-oriented OpenSpec workflow skills. A user who wants to tell an agent to operate `usb.ids` as a product from this repository does not have a repo-local skill that routes the agent toward the primary CLI surface.

## What Changes

- Add a user-facing application skill under `.agents/skills/usb-ids-app/`.
- Make the skill explicitly CLI-first, with package-local working-directory guidance and failure/exit-code boundaries.
- Add user-facing metadata so the skill can be invoked directly by name.
- Document a copyable invocation prompt in `README.md`.
- Extend agent-governance requirements to cover user-facing skill discovery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `agent-governance`: require a repo-local user-facing application skill and README discovery path for invoking it.

## Impact

- Adds a new repo-local skill and UI metadata under `.agents/skills/`.
- Updates repository documentation and agent-governance specification.
- Does not change CLI, SDK, web runtime, or release behavior.
