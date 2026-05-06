# usb.ids

<div align="center">

[![npm version](https://img.shields.io/npm/v/usb.ids)](https://www.npmjs.com/package/usb.ids) [![npm downloads](https://img.shields.io/npm/dm/usb.ids)](https://www.npmjs.com/package/usb.ids)

[![Last Updated](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2Fusb.ids%2Fusb.ids.version.json&query=%24.fetchTimeFormatted&label=latest%20release&color=blue)](https://www.npmjs.com/package/usb.ids) [![Auto Update](https://img.shields.io/github/actions/workflow/status/Drswith/usb.ids/auto-update.yml?label=auto%20update)](https://github.com/Drswith/usb.ids/actions/workflows/auto-update.yml) [![GitHub Pages](https://img.shields.io/github/actions/workflow/status/Drswith/usb.ids/github-pages.yml?label=github%20pages)](https://github.com/Drswith/usb.ids/actions/workflows/github-pages.yml)

</div>

Published USB ID registry data (vendors, devices, USB classes, HID tables, and related sections from the official `usb.ids` file), a small Node API, a browser-safe entry, a CLI, and a search UI.

**Migrating from 1.x:** JSON on disk may be **schema v2** (`schemaVersion: 2`). Node helpers still return the legacy vendor map by default; use `toV1()` if you load v2 JSON yourself. See [docs/migration-v1-to-v2.md](docs/migration-v1-to-v2.md).

## Features

- **Dual runtimes:** Node default export loads bundled `usb.ids.json` with **no network** unless you call `updateUsbData` / `forceUpdate` APIs.
- **Browser:** import `usb.ids/browser` for `fetch` + pure filters/search (no `node:*`).
- **CLI:** `fetch`, `version`, `check`, `ui` (static UI + JSON routes).
- **Full parse:** Schema v2 includes vendors/devices/subsystems, class hierarchy, audio/HID/language/video aux tables.
- **Delivery:** Build emits minified JSON, compact layout, gzip/brotli, vendor shards under `dist/data/` (see [docs/architecture.md](docs/architecture.md)).

## Installation

```bash
npm install -g usb.ids    # CLI
npm install usb.ids       # library + data files
```

Yarn and pnpm work the same. The package does not run install-time fetch scripts.

## CLI

```bash
usb-ids fetch          # update cwd (or package) data
usb-ids fetch --force
usb-ids version
usb-ids check
usb-ids ui             # default port 3000
usb-ids ui --port 8080
usb-ids help
```

Publishing to npm is performed **only** by the GitHub Action `Auto Update USB.IDS` (local `pnpm run release` exits with instructions).

## Node API

```ts
import {
  filterVendors,
  getDevice,
  getDevices,
  getUsbData,
  getVendor,
  getVendors,
  loadUsbData,
  searchDevices,
  searchInData,
  updateUsbData,
} from 'usb.ids'

// Local data only (no network)
const data = await loadUsbData()
const vendors = await getVendors()
const vendor = await getVendor('05ac') // 4-digit hex: exact vendor id

// Explicit refresh (download + write files)
await updateUsbData({ force: true })
```

- String vendor/device filters: **four hex digits** are treated as **exact** ids; other strings use substring search on names/ids.
- `UsbApiError` and `ERROR_CODES` identify structured failures.

## Browser

```ts
import {
  filterVendors,
  loadUsbDataFromUrl,
  searchInData,
} from 'usb.ids/browser'

const data = await loadUsbDataFromUrl('https://unpkg.com/usb.ids@latest/usb.ids.json')
```

Use your own CDN URL; v2 JSON is normalized to v1-shaped vendor maps in Node APIs, but browser `loadUsbDataFromUrl` returns parsed JSON as-is—pass through `toV1` from the main export if you bundle the full package on the server only, or consume v2 directly.

## Conditional exports

| Subpath | Purpose |
|--------|---------|
| `usb.ids` | Node-oriented API (resolves to `dist/index.js`) / types |
| `usb.ids/browser` | Browser-safe bundle |
| `usb.ids/data/min` | `dist/data/usb.ids.min.json` (after `pnpm run build`) |
| `usb.ids/data/compact` | Compact array encoding |
| `usb.ids/data/vendors-index` | Vendor index for lazy loading |
| `usb.ids/data/version` | Manifest with optional `artifacts` sizes |

Root-published files: `usb.ids`, `usb.ids.json`, `usb.ids.version.json`, `dist/` (see `package.json` `files`).

## Schema v2 (summary)

Top-level fields include `schemaVersion: 2`, `vendors`, `classes`, `audioTerminals`, `hidDescriptors`, `hidItemTypes`, `biasTypes`, `phyTypes`, `hidUsagePages`, `languages`, `hidCountryCodes`, `videoTerminals`, `hcts`. Legacy tools expect a flat `Record<vendorId, UsbVendor>`; use `toV1(dataset)` from `usb.ids`.

## Data workflow (repository)

**Strategy A (this repo):** The auto-update workflow commits `usb.ids`, `usb.ids.json`, `usb.ids.version.json`, and bumps `package.json` **CalVer** `2.YYYYMMDD.N` when upstream content hash changes.

**Strategy B:** Keep large JSON out of git and run `pnpm run fetch-usb-ids` in CI before site build (see Pages workflow). Pick one policy per fork; this upstream uses A.

Dry-run: workflow dispatch mode **dry-run** runs fetch + full build without commit or npm publish.

## Development

Requirements: Node ≥ 18, pnpm recommended.

```bash
pnpm install
pnpm run fetch-usb-ids    # optional: refresh data
pnpm run lint && pnpm run typecheck
pnpm run test:coverage    # coverage thresholds in vitest.config.ts
pnpm run test:bench       # optional vitest bench
pnpm run build            # lib + dist/data artefacts + ui
```

## Docs

- [Architecture & data flow](docs/architecture.md)
- [Migrate v1 JSON to v2](docs/migration-v1-to-v2.md)
- [API overview](docs/api.md)
- [Contributing / parser fixtures](docs/contributing.md)

## License

MIT — see [LICENSE](LICENSE).
