/**
 * Base path the packaged CLI `ui` server mounts the web app under
 * (`packages/cli` serves the UI and its data files below this path).
 *
 * `vite.config.ts` uses this as the no-env build default, and
 * `app/data-source.ts` compares `import.meta.env.BASE_URL` against it to
 * detect local-data mode. Keep it a plain constant module with no top-level
 * `import.meta` access so the Node-side Vite config can import it safely.
 */
export const UI_LOCAL_BASE_URL = "/__usb_ids__/";
