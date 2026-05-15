# API overview

Generated TypeScript definitions ship in `dist/index.d.ts`. This page summarizes the main entry points.

## Node (`usb.ids`)

| Export                                                                                   | Description                                                                            |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `loadUsbData()` / `loadUsbDataSync()`                                                    | Read bundled `usb.ids.json` from the package root; **no network**.                     |
| `updateUsbData({ force?, root? })`                                                       | Download, parse, write files under `root` (default: package root).                     |
| `getVendors` / `getVendor` / `getDevices` / `getDevice` / `getUsbData` / `searchDevices` | Async helpers over loaded data; optional `forceUpdate` triggers `updateUsbData` first. |
| `filterVendors` / `filterDevices` / `searchInData`                                       | Pure functions on an in-memory `UsbIdsData` map.                                       |
| `toV1` / `isDatasetV2`                                                                   | Schema conversion.                                                                     |
| `UsbApiError` / `ERROR_CODES`                                                            | Structured errors.                                                                     |

## Browser (`usb.ids/browser`)

| Export                                             | Description                                                       |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| `loadUsbDataFromUrl(url)`                          | `fetch` + `JSON.parse`; throws `UsbApiError` on HTTP/JSON errors. |
| `filterVendors` / `filterDevices` / `searchInData` | Same pure implementations as Node.                                |

## CLI (`usb-ids` binary)

Installed globally or via `pnpm exec`. Subcommands: `fetch`, `version`, `check`, `ui`, `help`. See README.

Optional: run `pnpm exec typedoc` if you add TypeDoc as a devDependency to refresh a full symbol listing into `docs/api/`.
