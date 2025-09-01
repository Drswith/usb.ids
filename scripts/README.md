# Scripts Directory

This directory contains utility scripts for the USB.IDS project. Each script serves a specific purpose in the project's automation and maintenance workflow.

## Available Scripts

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
> **📦 Latest Release**
>
> **Version:** `1.0.xxxxx`
> **Updated:** `YYYY-MM-DD HH:MM:SS UTC`
> **Status:** ✅ Auto-updated daily
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
