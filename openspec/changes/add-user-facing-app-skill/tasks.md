## 1. OpenSpec And Governance

- [x] 1.1 Document the user-facing app skill change in OpenSpec artifacts and tie it to issue [#32](https://github.com/Drswith/usb.ids/issues/32).
- [x] 1.2 Extend `agent-governance` requirements for user-facing skill discovery.

## 2. Skill Implementation

- [x] 2.1 Add `.agents/skills/usb-ids-app/SKILL.md` with CLI-first workflows, package-local working-directory rules, and maintainer-vs-product boundaries.
- [x] 2.2 Add `.agents/skills/usb-ids-app/agents/openai.yaml` with a direct invocation prompt for the skill.

## 3. Documentation And Validation

- [x] 3.1 Update `README.md` with a discoverable skill entry and copyable prompt.
- [x] 3.2 Run `pnpm run openspec:validate`.
- [x] 3.3 Validate the new skill metadata and run targeted workspace checks for the touched surfaces.
