# Architecture

## High-level flow

```mermaid
flowchart TB
  subgraph sources [Upstream]
    U1[linux-usb.org usb.ids]
    U2[systemd usb.ids mirror]
  end
  subgraph fetch [Fetch layer]
    F[fetcher / downloadFromUrls]
  end
  subgraph parse [Parse]
    P[parseUsbIdsFull → UsbDatasetV2]
  end
  subgraph io [Repository]
    R[file-store: raw + json + version]
  end
  subgraph consumers [Consumers]
    API[Node API loadUsbData / updateUsbData]
    BR[browser entry + pure query]
    CLI[CLI fetch / ui]
    UI[Vite web UI]
  end
  U1 --> F
  U2 --> F
  F --> P
  P --> R
  R --> API
  R --> CLI
  API --> BR
  R --> UI
  CLI --> UI
```

## Modules

| Layer | Role |
|-------|------|
| `src/fetcher` | HTTP GET with retries, timeouts, `Accept-Encoding` |
| `src/parser` | Line-based state machine for full `usb.ids`; hash + version metadata |
| `src/repository` | Read/write `usb.ids`, `usb.ids.json`, `usb.ids.version.json` |
| `src/service` | Orchestrates fetch → parse → persist version info |
| `src/node/data` | Package-root resolution + `loadUsbData` / `updateUsbData` |
| `src/pure/query` | Vendor/device filter + search (shared Node/browser) |
| `src/legacy/to-v1` | v2 dataset → legacy `Record<vid, UsbVendor>` |
| `scripts/build-artifacts.ts` | Emits `dist/data/*` (min, compact, shards, compressed, version manifest) |

## Versioning

- **npm / `usb.ids.version.json`:** CalVer `2.YYYYMMDD.N` after the 2.x cut, aligned with automated releases.
- **Content:** `contentHash` (SHA-256 of raw `usb.ids` text) drives “needs update” in CI vs published npm payload.
