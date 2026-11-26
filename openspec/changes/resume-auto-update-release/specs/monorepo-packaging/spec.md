# monorepo-packaging Delta

## MODIFIED Requirements

### Requirement: Automated Publishing Compatibility

The auto-update workflow SHALL publish package artifacts from the correct workspace package paths after data refreshes, and it SHALL only tag or publish versions derived from a refreshed, normalized release manifest with provenance-compatible package metadata. The release pipeline SHALL be resumable: each stage SHALL decide from repository and registry state whether its work is already done, so a run that resumes after a partial failure completes the release instead of colliding with completed work, and transient remote rejections of the tag push SHALL be retried before the run gives up.

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

#### Scenario: Generated package JSON is committed back to main

- **WHEN** the CLI fetch and release pipeline rewrites `packages/cli/usb.ids.json` or `packages/cli/usb.ids.version.json`
- **THEN** the persisted JSON matches the repository formatting contract without requiring a follow-up manual formatting commit
- **THEN** the resulting main-branch verification run passes `pnpm run format`

#### Scenario: Run resumes after the data commit is already on main

- **WHEN** the auto-update workflow runs and the checked-in release manifest already matches the upstream content hash (no new upstream data) while the local release version is not yet published to npm
- **THEN** it skips the fetch, version-bump, and data commit stages without creating a duplicate data commit
- **THEN** it still builds the package artifacts required for npm publish
- **THEN** it proceeds with tagging, release notes, and npm publish for the pending version

#### Scenario: Release tag already exists at the expected commit

- **WHEN** the tag for the pending release version already exists on the remote and peels to the head commit of the run
- **THEN** the workflow accepts the existing tag and continues with release notes and npm publish without failing or moving the tag

#### Scenario: Existing release tag points elsewhere

- **WHEN** the tag for the pending release version exists on the remote but peels to a different commit
- **THEN** the workflow fails the tag stage with an explicit error message and does not move or overwrite the tag

#### Scenario: Tag push is transiently rejected

- **WHEN** the remote rejects the tag push during the tag stage
- **THEN** the workflow retries the push a bounded number of times before failing the run
- **THEN** a subsequent scheduled run resumes the release from the completed stages instead of wedging npm publication

#### Scenario: Planning emits machine-readable decisions

- **WHEN** the auto-update workflow plans the run
- **THEN** the planning script reports upstream, npm, and local manifest state together with the derived stage decisions in JSON form
- **THEN** the workflow gates fetch, build, commit, tag, changelog, and publish stages on those decisions rather than a single exit code

#### Scenario: Steady state stays a no-op

- **WHEN** the upstream content hash equals the hash published in the latest npm version and the local release version equals the published npm version
- **THEN** the auto-update workflow skips fetch, build, commit, tag, changelog, and publish stages and exits successfully
