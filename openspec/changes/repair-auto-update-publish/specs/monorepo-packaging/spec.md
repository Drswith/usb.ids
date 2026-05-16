## MODIFIED Requirements

### Requirement: Automated Publishing Compatibility

The auto-update workflow SHALL publish package artifacts from the correct workspace package paths after data refreshes, and it SHALL only tag or publish versions derived from a refreshed, normalized release manifest with provenance-compatible package metadata.

#### Scenario: Upstream USB IDs data changes

- **WHEN** the auto-update workflow detects changed upstream data
- **THEN** it updates generated data in the CLI package ownership path
- **THEN** it builds all required package artifacts
- **THEN** it publishes the intended npm package or packages without relying on root package publication

#### Scenario: Maintainer triggers a forced release refresh

- **WHEN** a maintainer dispatches the auto-update workflow with `update_mode=force`
- **THEN** the workflow runs the CLI fetch path with force-refresh semantics instead of silently reusing the local fallback manifest
- **THEN** the workflow prepares a fresh normalized release manifest before resolving the publish version

#### Scenario: Workflow prepares provenance-backed npm publish

- **WHEN** the auto-update workflow resolves the package version for tagging or npm publish
- **THEN** it uses the normalized refreshed release manifest and updated package manifest, not a stale legacy manifest field
- **THEN** the published package manifest includes repository metadata that matches the source repository used by GitHub provenance
