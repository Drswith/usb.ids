# API Overview

This repository is CLI-first. Programmatic usage is secondary and published from `@usb-ids/sdk`.

## CLI (`usb-ids`)

Primary automation interface:

- `fetch [--force] [--offline]`
- `version [--json]`
- `check [--json]`
- `ui [--port <port>]`
- `help`

Exit codes are stable:

- `0` success
- `2` usage
- `3` data missing
- `4` network
- `5` parse
- `6` filesystem

`version --json` and `check --json` return JSON via stdout for agents.

## SDK (`@usb-ids/sdk`)

Core exports include:

- Node data loading/update: `loadUsbData`, `loadUsbDataSync`, `updateUsbData`
- Query helpers: `filterVendors`, `filterDevices`, `searchInData`
- Higher-level async helpers: `getVendors`, `getVendor`, `getDevices`, `getDevice`, `getUsbData`, `searchDevices`
- Browser entry: `@usb-ids/sdk/browser`
- Types: `UsbIdsData`, `UsbDatasetV2`, `VersionInfo`, etc.
- Compatibility helpers: `isDatasetV2`, `toV1`

## Compatibility Note

`usb.ids` (CLI package) currently provides a compatibility export that re-exports SDK APIs.  
New SDK consumers should migrate to `@usb-ids/sdk` directly.
