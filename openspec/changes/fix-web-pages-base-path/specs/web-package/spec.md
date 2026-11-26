# web-package Delta

## ADDED Requirements

### Requirement: Web Build Base Path Resolution

The web package build SHALL resolve its served base path from the `VITE_BASE_PATH` environment variable, falling back to the CLI UI mount path (`/__usb_ids__/`) when the variable is unset or empty, so the same app builds correctly for both the GitHub Pages project path and the CLI-served UI.

#### Scenario: Pages build passes the project base path

- **WHEN** the web package builds with `VITE_BASE_PATH=/usb.ids/`
- **THEN** emitted HTML and asset references use the `/usb.ids/` base
- **THEN** `import.meta.env.BASE_URL` differs from the CLI UI mount path, so the app loads data from the npm CDN

#### Scenario: Build without a base path override

- **WHEN** the web package builds or serves without `VITE_BASE_PATH`
- **THEN** the base path is the CLI UI mount path (`/__usb_ids__/`)
- **THEN** `import.meta.env.BASE_URL` equals the CLI UI mount path, so the app loads data from its local server

## MODIFIED Requirements

### Requirement: GitHub Pages Workspace Deployment

The GitHub Pages workflow SHALL build and deploy the web package output from the monorepo workspace under the Pages project base path, so the deployed page references assets that resolve at the site URL.

#### Scenario: Main branch deploys Pages

- **WHEN** a commit reaches `main`
- **THEN** the Pages workflow installs with pnpm
- **THEN** it builds `packages/web` with the Pages project base path (`VITE_BASE_PATH=/usb.ids/`)
- **THEN** it uploads the web package output directory whose HTML references assets resolvable at the deployed site URL
