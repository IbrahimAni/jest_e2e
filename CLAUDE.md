# jest-e2e — agent instructions

Jest + Puppeteer E2E testing framework published to npm as `jest-e2e`, with a
Docusaurus docs site in `website/` deployed to
https://genfixs-limited.github.io/jest_e2e/.

## Publishing (mandatory)

**Before running `npm publish` or `npm version`, read [RELEASING.md](RELEASING.md)
and complete every step in it.** In particular:

- The website docs in `website/docs/` must be updated to match any CLI, API, or
  behavior change being released (RELEASING.md has the source→docs map).
- `CHANGELOG.md` must gain a section for the new version.
- `npm run test:framework` must pass and the packed tarball must be
  smoke-tested before publishing.
- After publishing, the website must be rebuilt and deployed
  (`cd website && npm run build && npm run deploy`).

Never publish with unreleased user-visible changes missing from the changelog
or the website docs.

## Development notes

- Framework unit tests: `npm run test:framework` (Jest, `__tests__/unit/`).
- Dogfood E2E examples (real browser; also the CLI init examples): `__tests__/e2e/`.
- User-visible changes to the CLI (`bin/jest-e2e.js`) must also update the
  `--help` text, `CLI_README.md`, and `website/docs/api/cli.md`.
- Keep an `[Unreleased]` section in `CHANGELOG.md` current as user-visible
  changes land, so releases don't require archaeology.
