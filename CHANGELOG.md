# Changelog

All notable changes to jest-e2e are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

Before releasing, follow [RELEASING.md](RELEASING.md).

## [Unreleased]

## [1.3.0] - 2026-07-23

### Added
- `init` banner: ANSI Shadow block wordmark rendered in plain white, boxed
  welcome panel with the framework version, scaffold checklist, and
  next-steps section. Output stays plain when piped or when
  `NO_COLOR`/`TERM=dumb` is set.
- Authenticated deployment support: pass an `auth` config (via
  `jest-e2e.config.js`/`.mjs`/`.cjs`/`.json`, `$JEST_E2E_CONFIG`, or the
  `JEST_E2E_AUTH_CONFIG`/`JEST_E2E_AUTH_HEADER_NAME` env vars) to inject
  headers, cookies, or query params into requests. Ships a built-in `vercel`
  provider (`x-vercel-protection-bypass` + bypass cookie) for Vercel
  Deployment Protection. `init` now scaffolds a project-level
  `jest-e2e.config.js` and adds `.env` to the generated `.gitignore`.

### Changed
- Colorized test-run output: `PASS`/`FAIL`/`SKIP` lines are reformatted as
  colored `Pass:`/`Fail:`/`Skip:` with the test file name; Jest's summary block
  is suppressed unless `--verbose` is used.
- Repo test layout: framework unit tests moved to `__tests__/unit/` and example
  e2e tests to `__tests__/e2e/`. The published package now ships only
  `__tests__/e2e/` (smaller tarball); `init` scaffolding in user projects is
  unchanged.

## [1.2.0] - 2026-07-08

### Added
- Smooth mode for visible runs: orange cursor overlay, pointer glide, click
  ripple, and target highlight.
- Full checkout-journey example e2e test (sign in → cart → checkout).

### Fixed
- Visual-mode timeouts: slow motion is paced by the framework action layer
  instead of Puppeteer's protocol-level `slowMo`, and headed runs default to a
  120s per-test timeout.

## [1.1.1] - 2026-07-08

### Fixed
- CLI no longer auto-initializes a project when a specific test name was
  requested in a directory without a jest-e2e project.

### Changed
- Repository URLs updated after the transfer to `genfixs-limited`.
- Added the Docusaurus documentation site with GitHub Pages deploy.

## [1.1.0] - 2026-07-07

### Added
- `fill`, `clear`, and `press` actions.
- REPL support with custom Puppeteer environment teardown.
- Data builders and example sign-up test.

### Fixed
- Core assertion, CLI, and ChromeE2EApi bugs.
- Normalized `package.json` bin path and repository URL.

[Unreleased]: https://github.com/genfixs-limited/jest_e2e/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/genfixs-limited/jest_e2e/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/genfixs-limited/jest_e2e/compare/6b6dd5c...v1.1.1
[1.1.0]: https://github.com/genfixs-limited/jest_e2e/commit/6b6dd5c
