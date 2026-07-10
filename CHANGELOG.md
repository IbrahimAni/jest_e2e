# Changelog

All notable changes to jest-e2e are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

Before releasing, follow [RELEASING.md](RELEASING.md).

## [Unreleased]

### Added
- Gemini-style `init` banner: ANSI Shadow block wordmark with a blue→purple→pink
  gradient (truecolor with xterm-256 fallback), boxed welcome panel with the
  framework version, scaffold checklist, and next-steps section. Output stays
  plain when piped or when `NO_COLOR`/`TERM=dumb` is set.

### Changed
- Colorized test-run output: `PASS`/`FAIL`/`SKIP` lines are reformatted as
  colored `Pass:`/`Fail:`/`Skip:` with the test file name; Jest's summary block
  is suppressed unless `--verbose` is used.

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
