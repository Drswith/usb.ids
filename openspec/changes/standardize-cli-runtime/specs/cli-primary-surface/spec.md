## ADDED Requirements

### Requirement: Standardized CLI Command Framework

The CLI SHALL use a declarative command framework for command registration, option parsing, and help/error rendering.

#### Scenario: Known command execution

- **WHEN** a user runs a supported command such as `usb-ids fetch --offline`
- **THEN** command routing is handled through framework-registered command handlers
- **THEN** the command returns the same explicit exit-code contract as before

#### Scenario: Unknown command execution

- **WHEN** a user runs `usb-ids does-not-exist`
- **THEN** the CLI reports an unknown-command usage error to stderr
- **THEN** process exit code is `2`

### Requirement: Optional Interactive Confirmation for Force Fetch

The CLI SHALL support optional interactive confirmation for force refresh while preserving non-interactive automation behavior.

#### Scenario: Interactive force fetch asks confirmation

- **WHEN** a user runs `usb-ids fetch --force --interactive` in an interactive terminal
- **THEN** the CLI prompts for confirmation before updating local data artifacts
- **THEN** `--yes` bypasses the prompt

#### Scenario: Automation flow remains non-interactive

- **WHEN** an agent or CI runs `usb-ids fetch --force` without `--interactive`
- **THEN** no prompt is shown
- **THEN** command execution remains scriptable and deterministic
