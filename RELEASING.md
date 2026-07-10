# Releasing jest-e2e

**This checklist is mandatory before every `npm publish`. If you are an AI agent
preparing a release, work through every step in order and do not run
`npm publish` until all steps pass.** Human-oriented npm account setup lives in
[PUBLISH.md](PUBLISH.md); this file is the source of truth for the release
process itself.

## 1. Review what changed since the last release

```bash
git tag --sort=-v:refname | head -3   # find the latest release tag
git log --oneline vX.Y.Z..HEAD        # everything going into this release
git diff --stat vX.Y.Z..HEAD          # which areas were touched
```

Classify every change as **feature**, **fix**, or **breaking** — this decides
the version bump (minor / patch / major) and drives the changelog and docs work
below.

## 2. Sync the docs (website + repo)

The Docusaurus site in `website/` is published to
<https://genfixs-limited.github.io/jest_e2e/> and must describe the version
being released. Use this map — for each source area touched since the last tag,
update every listed doc:

| Source changed | Docs that must be updated |
|---|---|
| `bin/jest-e2e.js` (flags, commands, init, output) | `website/docs/api/cli.md`, `CLI_README.md`, `--help` text in `bin/jest-e2e.js`, README usage section |
| `index.js` exports / `E2ESetup` | `website/docs/api/e2e-setup.md` |
| Chrome API / actions (`createChromeE2EApi`, fill/press/click…) | `website/docs/api/chrome-api.md`, `website/docs/guide/actions.md` |
| Assertions | `website/docs/api/assertions.md`, `website/docs/guide/assertions.md` |
| Device / auto-wait / smooth mode | `website/docs/api/device.md`, `website/docs/guide/debugging.md` |
| `databuilders/` | `website/docs/guide/test-data.md`, `EXAMPLES.md` |
| Example tests in `__tests__/` | `website/docs/guide/writing-tests.md`, `EXAMPLES.md` |
| CI behavior (headless, retries, timeouts) | `website/docs/guide/ci.md` |
| Anything user-visible | `README.md`, `website/docs/intro.md` |

Checklist:

- [ ] Every new/changed CLI flag appears in `website/docs/api/cli.md`, `CLI_README.md`, and the `--help` output — with identical defaults.
- [ ] Every new/changed public API appears on its `website/docs/api/` page.
- [ ] No doc page still describes removed or renamed behavior (`grep` the old name across `website/docs/`, `README.md`, `CLI_README.md`, `EXAMPLES.md`).
- [ ] Code samples in the docs actually run against this release.

## 3. Update CHANGELOG.md

Move the `[Unreleased]` entries into a new `[X.Y.Z] - YYYY-MM-DD` section
(Keep a Changelog format: Added / Changed / Fixed / Removed). Every commit from
step 1 that users can observe must be represented. Leave an empty
`[Unreleased]` section at the top.

## 4. Verify the package

```bash
npm run test:framework          # all framework tests must pass
npm pack                        # build the tarball
```

Smoke-test the tarball in a scratch directory (never inside this repo):

```bash
mkdir -p /tmp/jest-e2e-release-check && cd /tmp/jest-e2e-release-check
npm init -y >/dev/null
npm install /path/to/jest-e2e-X.Y.Z.tgz
npx jest-e2e --help             # help renders, flags match the docs
npx jest-e2e init               # banner renders, scaffold is complete
```

- [ ] `npm run test:framework` passes.
- [ ] Tarball init scaffolds `__tests__/`, `databuilders/`, `config/`, `jest-puppeteer.config.js`.
- [ ] Delete the scratch directory and the local `.tgz` afterwards.

## 5. Bump the version

```bash
npm version patch   # fixes only
npm version minor   # new features, backwards compatible
npm version major   # breaking changes
```

This commits and tags automatically. The changelog section from step 3 must
use the exact same version number.

## 6. Publish

```bash
npm publish --access public
```

## 7. Deploy the website

```bash
cd website
npm run build       # must succeed with zero broken links
GIT_USER=<github-username> npm run deploy   # pushes to gh-pages
```

- [ ] `npm run build` completes without broken-link warnings.
- [ ] Spot-check the live site shows the new docs after deploy.

## 8. Push everything

```bash
git push origin main --follow-tags
```

Confirm: the npm page shows the new version, the tag exists on GitHub, and the
website reflects the release.
