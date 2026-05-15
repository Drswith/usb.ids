## 1. Governance Bootstrap

- [ ] 1.1 Land OpenSpec, `.agents/skills`, `AGENTS.md`, common GitHub issue templates, and the pull request template. ([#1](https://github.com/Drswith/usb.ids/issues/1))
- [ ] 1.2 Add root OpenSpec npm scripts and include OpenSpec validation in local and CI guidance. ([#2](https://github.com/Drswith/usb.ids/issues/2))
- [ ] 1.3 Audit current files and produce a package ownership map for `sdk`, `cli`, and `web`. ([#3](https://github.com/Drswith/usb.ids/issues/3))

## 2. Workspace Skeleton

- [ ] 2.1 Add `pnpm-workspace.yaml` and convert the root package into private workspace orchestration. ([#4](https://github.com/Drswith/usb.ids/issues/4))
- [ ] 2.2 Create initial `packages/sdk`, `packages/cli`, and `packages/web` package manifests. ([#5](https://github.com/Drswith/usb.ids/issues/5))
- [ ] 2.3 Move shared TypeScript, Vitest, lint/format, tsdown, and Vite config to workspace-aware paths without changing behavior. ([#6](https://github.com/Drswith/usb.ids/issues/6))
- [ ] 2.4 Migrate the existing ESLint + Antfu/formatting toolchain to oxlint + oxfmt with a light Oxc-default configuration. ([#23](https://github.com/Drswith/usb.ids/issues/23))

## 3. SDK Package Migration

- [ ] 3.1 Move parser, fetcher, repository, pure query, version, errors, and type modules into `packages/sdk`. ([#7](https://github.com/Drswith/usb.ids/issues/7))
- [ ] 3.2 Define `@usb-ids/sdk` exports for Node, browser, types, and documented public subpaths. ([#8](https://github.com/Drswith/usb.ids/issues/8))
- [ ] 3.3 Move SDK unit tests and fixtures under the SDK package and update imports. ([#9](https://github.com/Drswith/usb.ids/issues/9))
- [ ] 3.4 Add SDK data source configuration so SDK consumers do not depend on root-relative data files. ([#10](https://github.com/Drswith/usb.ids/issues/10))

## 4. CLI Package Migration

- [ ] 4.1 Move CLI runtime, CLI package metadata, binary entry, and generated data ownership into `packages/cli`. ([#11](https://github.com/Drswith/usb.ids/issues/11))
- [ ] 4.2 Wire CLI commands to SDK package APIs through stable workspace imports. ([#12](https://github.com/Drswith/usb.ids/issues/12))
- [ ] 4.3 Add `--json` output for `version` and `check` with clean stdout/stderr separation. ([#13](https://github.com/Drswith/usb.ids/issues/13))
- [ ] 4.4 Define and test explicit CLI exit codes for usage, data, network, parse, and filesystem failures. ([#14](https://github.com/Drswith/usb.ids/issues/14))
- [ ] 4.5 Add built-binary CLI integration tests for help, version, check, fetch fixture mode, and UI startup paths. ([#15](https://github.com/Drswith/usb.ids/issues/15))

## 5. Web Package Migration

- [ ] 5.1 Move `app/`, `public/`, `index.html`, and web-specific config into `packages/web`. ([#16](https://github.com/Drswith/usb.ids/issues/16))
- [ ] 5.2 Update the web app to consume SDK browser/query helpers and configured data URLs. ([#17](https://github.com/Drswith/usb.ids/issues/17))
- [ ] 5.3 Update GitHub Pages workflow to build and upload the web workspace package. ([#18](https://github.com/Drswith/usb.ids/issues/18))

## 6. Release, Docs, and Closure

- [ ] 6.1 Update CI to run workspace-aware lint, typecheck, tests, build, and OpenSpec validation. ([#19](https://github.com/Drswith/usb.ids/issues/19))
- [ ] 6.2 Update auto-update and npm publish workflow paths for CLI-owned data artifacts and package-level publication. ([#20](https://github.com/Drswith/usb.ids/issues/20))
- [ ] 6.3 Rewrite README and docs so CLI usage leads, SDK usage is secondary, and monorepo commands are current. ([#21](https://github.com/Drswith/usb.ids/issues/21))
- [ ] 6.4 Verify package contents, global CLI install behavior, SDK imports, web build, and auto-update dry-run before archiving the OpenSpec change. ([#22](https://github.com/Drswith/usb.ids/issues/22))
