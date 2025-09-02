# Scripts Directory

This directory contains utility scripts for the USB ID's project. Each script serves a specific purpose in the project's automation and maintenance workflow.

## Available Scripts

### `diff-hash.ts`

Compares content hashes between remote USB ID's data and the published npm package to determine if an update is needed. Designed for use in GitHub Actions workflow.

#### Purpose
Determines whether the automated update workflow should proceed by comparing the content hash of remote USB ID's data with the hash from the latest published npm package.

#### Usage

```bash
# Run using npm script (recommended)
pnpm run diff-hash

# Or run directly with tsx
tsx scripts/diff-hash.ts
```

#### What it does

1. Downloads remote USB ID's data from official sources using `downloadFromUrls()` from `src/fetcher.ts`
2. Calculates content hash using `generateContentHash()` from `src/parser.ts`
3. Fetches version information from the latest npm package
4. Compares the content hashes
5. Exits with appropriate exit codes for shell script integration

#### Exit Codes

- **0**: No update needed (content hashes match)
- **1**: Update needed (content hashes differ or error occurred)

#### Key Features

- **Shell Integration**: Designed for use in GitHub Actions workflows
- **Error Handling**: Gracefully handles network errors and missing data
- **Code Reuse**: Leverages existing functions from `src/fetcher.ts`, `src/parser.ts`, and `src/utils.ts`
- **Detailed Logging**: Provides clear status messages for debugging
- **Content-based Detection**: Uses SHA256 hash comparison for accurate change detection

#### GitHub Actions Integration

```yaml
- name: Check if update is needed
  id: check-update
  run: |
    if pnpm run diff-hash; then
      echo "skip=true" >> $GITHUB_OUTPUT
    else
      echo "skip=false" >> $GITHUB_OUTPUT
    fi
```

### `update-readme-version.ts`

Updates the version information in the project's README.md file based on data from `usb.ids.version.json`.

#### Purpose
Synchronizes the version information displayed in README.md with the actual data version to ensure documentation accuracy.

#### Usage

```bash
# Run using npm script (recommended)
pnpm run update-readme-version

# Or run directly with tsx
tsx scripts/update-readme-version.ts
```

#### What it does

1. Uses `loadVersionInfo()` from `src/core.ts` to read version data
2. Locates the version placeholder markers in README.md
3. Updates the version block with new information using proper Markdown formatting
4. Provides detailed logging using the project's logger utility

#### Key Features

- **TypeScript Support**: Written in TypeScript for type safety
- **Code Reuse**: Leverages existing functions from `src/core.ts`, `src/config.ts`, and `src/utils.ts`
- **ES Module Compatible**: Properly handles ES module imports and execution detection
- **Robust Error Handling**: Comprehensive error checking with helpful messages
- **Standardized Logging**: Uses the project's logger utility for consistent output formatting
- **Detailed Statistics**: Shows version, update time, vendor count, and device count

#### Requirements

- `usb.ids.version.json` must exist in the project root
- README.md must contain the version placeholders:
  ```markdown
  <!-- START VERSION PLACEHOLDER -->
  <!-- END VERSION PLACEHOLDER -->
  ```
- TypeScript dependencies (`tsx`) must be installed

#### Output Format

The script updates README.md with a styled version block:

```markdown
<div align="center">

### 📦 Latest Release

| Field | Value |
|----------|-------|
| **Version** | `1.0.xxxxx` |
| **Updated** | `YYYY-MM-DD HH:MM:SS UTC` |
| **Status** | ✅ Auto-updated daily |

</div>
```

---

## Script Development Guidelines

When adding new scripts to this directory:

1. **Use TypeScript**: All scripts should be written in TypeScript for type safety
2. **Reuse Existing Code**: Leverage functions from `src/` modules instead of reimplementing
3. **Follow Naming Convention**: Use descriptive kebab-case names ending with `.ts`
4. **Add Documentation**: Update this README.md with script description and usage
5. **Use Project Logger**: Use `logger` from `src/utils.ts` for consistent output formatting
6. **Include npm Script**: Add corresponding script entry in `package.json`
7. **Handle Errors Gracefully**: Provide helpful error messages and proper exit codes
