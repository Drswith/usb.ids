# usb.ids

USB registry data and the `usb-ids` command line tool.

## Install

```bash
npm install -g usb.ids
```

## CLI

```bash
usb-ids fetch
usb-ids fetch --force
usb-ids fetch --force --interactive
usb-ids fetch --force --interactive --yes
usb-ids fetch --offline
usb-ids version
usb-ids version --json
usb-ids check
usb-ids check --json
usb-ids ui --port 3000
usb-ids help
```

Stable exit codes:

- `0` success
- `2` usage error
- `3` data missing
- `4` network failure
- `5` parse failure
- `6` filesystem failure

`version --json` and `check --json` write machine-readable JSON to `stdout` only.

## Data Files

The package includes the generated registry data:

- `usb.ids`
- `usb.ids.json`
- `usb.ids.version.json`
- `dist/data/usb.ids.min.json`
- `dist/data/usb.ids.compact.json`
- `dist/data/vendors.index.json`
- `dist/data/vendors/*.json`

## SDK

Programmatic access is available as a secondary interface:

```ts
import { getVendors, loadUsbData, searchInData } from "usb.ids";

const data = await loadUsbData();
const vendors = await getVendors();
const found = searchInData(data, "keyboard");
```

Browser-safe subpath:

```ts
import { filterVendors, searchInData } from "usb.ids/browser";
```

## Source

Repository: https://github.com/Drswith/usb.ids

## License

MIT
