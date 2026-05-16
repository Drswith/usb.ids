# Design: repair-auto-update-publish

## Goals

1. Make a forced auto-update run perform a real refresh instead of silently reusing the local fallback manifest.
2. Prevent future release attempts from downgrading `packages/cli/package.json` from a stale legacy manifest field.
3. Satisfy npm trusted publishing provenance checks for the `usb.ids` package.

## Non-Goals

- No CLI surface changes.
- No general release pipeline redesign beyond the minimal fix set needed to restore publishability.
- No changes to the scheduled no-op detection logic.

## Decisions

### 1) Force mode must forward `--force` to the CLI fetch command

The workflow already distinguishes `update_mode=force` at the planning layer, but it never passes that intent to `usb-ids fetch`. The fix is to branch the fetch command in the workflow so force mode executes the same CLI path with `--force`.

### 2) Publish version resolution must fail closed on legacy manifests

The workflow currently falls back to `usb.ids.version.json.version`, which is a legacy field and can be lower than the currently published npm version. After a real refresh, the manifest should expose a normalized `releaseVersion`. The workflow should require that field and stop before tagging or publishing if it is absent.

### 3) Provenance metadata belongs in the published package manifest

Trusted publishing checks the package manifest against GitHub provenance. `packages/cli/package.json` therefore needs an explicit repository URL matching `https://github.com/Drswith/usb.ids`.

## Risks / Trade-offs

- If fetch still falls back to the legacy manifest under force mode, releases will now fail earlier instead of creating a tag and then failing at publish. This is intentional.
- The package jumps from legacy `1.0.<timestamp>` tags toward normalized `releaseVersion` values once a real refreshed manifest is used. That is acceptable because it is monotonic and semver-valid.
