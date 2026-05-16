## ADDED Requirements

### Requirement: User-Facing Application Skill

The repository SHALL provide at least one repo-local application skill under `.agents/skills/` that tells an agent how to use `usb.ids` through its primary CLI workflows instead of starting from SDK internals.

#### Scenario: Agent runtime scans for product-use skills

- **WHEN** an agent runtime scans `.agents/skills/` for user-invokable project skills
- **THEN** it can discover a skill that covers `usb.ids` product workflows
- **THEN** the skill directs the agent to prefer the CLI as the primary surface
- **THEN** the skill documents current working-directory or packaging boundaries that affect command execution

### Requirement: User-Facing Skill Discovery In Root Docs

The repository SHALL document a copyable entry point for the user-facing application skill in the root README.

#### Scenario: User looks for how to invoke the application skill

- **WHEN** a user reads `README.md`
- **THEN** the README points to the repo-local application skill location
- **THEN** the README includes a copyable prompt that explicitly invokes the skill by name
