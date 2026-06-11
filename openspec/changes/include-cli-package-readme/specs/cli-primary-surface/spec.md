## MODIFIED Requirements

### Requirement: CLI First Documentation

The repository and published npm package SHALL document CLI installation, command usage, and automation examples before Node SDK usage.

#### Scenario: User reads the README

- **WHEN** a user opens the README
- **THEN** CLI installation and core commands appear before SDK import examples
- **THEN** SDK usage is explicitly described as a secondary programmatic interface

#### Scenario: User reads the npm package page

- **WHEN** a user opens the `usb.ids` npm package page
- **THEN** npm renders package README content
- **THEN** CLI installation and command usage appear before SDK import examples
