## ADDED Requirements

### Requirement: Agent Entry Guidance

The repository SHALL provide root-level agent guidance that states the product priority, active migration target, required workflow, shared agent asset location, validation commands, and CLI-first standards.

#### Scenario: Agent starts a new repository task

- **WHEN** an agent opens the repository before making a substantive change
- **THEN** the agent can read `AGENTS.md` and identify that CLI behavior is the primary product surface
- **THEN** the agent can identify the active OpenSpec change and expected package layout
- **THEN** the agent can identify `.agents/skills/` as the shared reusable skill directory

### Requirement: Vendor Neutral Agent Skills

The repository SHALL keep reusable OpenSpec agent skills under `.agents/skills/` rather than a single-vendor directory.

#### Scenario: Non-Codex agent consumes project skills

- **WHEN** an agent runtime scans the repository for reusable skills
- **THEN** OpenSpec skills are available under `.agents/skills/`
- **THEN** no required OpenSpec skill exists only under `.codex/skills/`

### Requirement: OpenSpec Planning Layer

The repository SHALL include OpenSpec artifacts for package-layout, public behavior, CI, release, and documentation changes.

#### Scenario: Contributor proposes a package refactor

- **WHEN** a contributor changes workspace package ownership or public command behavior
- **THEN** the change is represented under `openspec/changes/` with proposal, design, specs, and tasks before implementation is treated as complete

### Requirement: GitHub Contribution Templates

The repository SHALL provide common GitHub issue templates and a pull request template that route bugs, feature requests, tasks, validation evidence, and OpenSpec links into consistent fields.

#### Scenario: User files a bug report

- **WHEN** a GitHub user opens a bug issue
- **THEN** the template asks for affected surface, reproduction steps, expected behavior, actual behavior, environment, and validation evidence

#### Scenario: Contributor opens a pull request

- **WHEN** a contributor opens a pull request
- **THEN** the template asks for summary, linked issues, OpenSpec change, validation, CLI impact, SDK impact, web impact, and release impact
