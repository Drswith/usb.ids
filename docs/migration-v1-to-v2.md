# Migrating v1-shaped JSON to schema v2

## Background

The database file `usb.ids.json` may contain either:

1. **Legacy v1:** a flat object `Record<string, UsbVendor>` (keys are lower-case 4-digit vendor IDs).
2. **Schema v2:** `{ schemaVersion: 2, vendors, classes, hidUsagePages, ... }`.

Node-facing functions such as `getVendors()` / `loadUsbData()` normalize v2 to v1 internally so most call sites stay unchanged.

## If you read the JSON file directly

```ts
import type { UsbDatasetV2, UsbIdsData } from 'usb.ids'
import { isDatasetV2, toV1 } from 'usb.ids'

function normalize(raw: unknown): UsbIdsData {
  if (isDatasetV2(raw))
    return toV1(raw as UsbDatasetV2)
  return raw as UsbIdsData
}
```

## Browser helper

`loadUsbDataFromUrl` in `usb.ids/browser` returns parsed JSON. If you point at a v2 payload, use the same `isDatasetV2` / `toV1` pattern **only if** you bundle code that imports those symbols from a build that includes `legacy/to-v1` (the default browser entry is kept small; you may import from the main package in SSR or custom bundles).

## Fields only in v2

USB class hierarchy, HID usage pages, languages, video terminals, etc., are **dropped** by `toV1()`. If you need them, keep the full `UsbDatasetV2` object and do not flatten to v1.

## `usb.ids.version.json` manifest field renames

If you consume the published manifest next to `usb.ids.json`, note these renames (loaders may still accept the old keys):

| Previous | Current |
|----------|---------|
| `version` | `releaseVersion` (npm package version / CalVer) |
| `contentHash` | `upstreamHash` |
| `fetchTime` | `buildTime` |
| `fetchTimeFormatted` | `buildTimeFormatted` |
| `source` | *(removed; not a publish-time concern)* |

Added: `upstreamVersion` (`YYYY.MM.DD` from upstream `# Version`), optional `upstreamDate` (raw `# Date:` line). The CalVer middle segment `YYYYMMDD` matches `upstreamVersion` with dots removed.

Older releases used the **fetch** UTC date for that segment; newer releases use the **upstream** date from `usb.ids`.
