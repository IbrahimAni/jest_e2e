---
id: ci
title: Continuous integration
sidebar_position: 7
---

# Continuous integration

Jest E2E is CI-ready by default: when `CI=true` (set automatically by GitHub Actions and most CI providers), tests run headless with a fixed 1280×720 viewport and step logging disabled.

## GitHub Actions

```yaml title=".github/workflows/e2e.yml"
name: E2E tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx jest-e2e --retries 2

      # Failure screenshots make CI failures diagnosable
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: screenshots
          path: __screenshots__/
```

## Recommendations

**Upload `__screenshots__/` on failure.** Every failed test saves a full-page screenshot — in CI this is your only window into what the browser saw.

**Use retries in CI, sparingly.** `--retries 2` absorbs one-off network blips. If a test needs retries to pass *consistently*, fix the test.

**Pin timeouts to your app, not to hope.** If your slowest page takes 8 seconds to settle, set the auto-wait timeout above it once:

```bash
npx jest-e2e --timeout 15000
```

**Run headless locally too before pushing:**

```bash
npm run test:headless
```

## Environment variables

| Variable | Effect |
|---|---|
| `CI=true` | Headless browser, fixed viewport, steps off |
| `JEST_E2E_TIMEOUT=<ms>` | Auto-wait timeout for actions and assertions |
| `JEST_E2E_RETRIES=<n>` | Retry failed tests n times |
| `JEST_E2E_SCREENSHOT=false` | Disable failure screenshots |
| `JEST_SILENT=true` | Suppress step logging entirely |
| `JEST_FORCE_STEPS=true` | Force step logging on in CI |

The [CLI flags](/api/cli) set these for you; use the variables directly when invoking Jest without the CLI.
