## 1. Base Path Wiring

- [x] 1.1 Add `packages/web/app/base-url.ts` exporting the shared `UI_LOCAL_BASE_URL` constant (`/__usb_ids__/`) with the CLI `ui` mount-path contract documented.
- [x] 1.2 Set `base` in `packages/web/vite.config.ts` to `process.env.VITE_BASE_PATH || UI_LOCAL_BASE_URL`, importing the shared constant.
- [x] 1.3 Switch `packages/web/app/data-source.ts` to import `UI_LOCAL_BASE_URL` from the shared module instead of redefining it.

## 2. Validation

- [x] 2.1 Build the web package with `VITE_BASE_PATH=/usb.ids/` and assert the emitted `dist/index.html` references `/usb.ids/assets/` (and `/usb.ids/` public assets), then serve the output and confirm the page and its entry script resolve with no 404.
- [x] 2.2 Build without `VITE_BASE_PATH` and assert the emitted base is `/__usb_ids__/`.
- [x] 2.3 Run `pnpm run openspec:validate` plus workspace lint and typecheck.
- [ ] 2.4 Push to `main`, watch the Pages workflow complete, and verify the live site loads the app (version panel populated from npm data, search functional).
