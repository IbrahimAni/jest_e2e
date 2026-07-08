---
id: cli
title: CLI
sidebar_position: 5
---

# CLI

```bash
jest-e2e [command|test_name] [options]
```

Run all tests, one test by name, or initialize a project. On a project with no Jest E2E configuration, the CLI initializes automatically.

## Commands

```bash
npx jest-e2e               # run all tests (auto-initializes on first run)
npx jest-e2e login         # run test files matching "login"
npx jest-e2e init          # force (re-)initialization
```

## Options

| Option | Description | Default |
|---|---|---|
| `--useLocalBrowser [true]` | Run with a visible browser | headless |
| `--repl` | Keep the browser open after the test finishes | off |
| `--watch`, `-w` | Re-run tests when files change | off |
| `--timeout <ms>` | Per-test timeout **and** device auto-wait timeout | 30000 / 5000 |
| `--slowmo <ms>` | Delay between actions (implies visible browser) | 0 |
| `--retries <n>` | Retry failed tests n times | 0 |
| `--screenshot` | Screenshots on failure | on |
| `--no-screenshot` | Disable failure screenshots | — |
| `--silent` | No step logging | off |
| `--no-steps` | Disable step logging only | off |
| `--verbose`, `-v` | Full Jest output | off |
| `--debug` | Debug mode (`--detectOpenHandles`, DevTools) | off |
| `--help`, `-h` | Show help | — |

## Common invocations

```bash
# Debug one test with a visible browser, slowly
npx jest-e2e checkout --useLocalBrowser --slowmo 150

# Keep the browser open at the end to inspect state
npx jest-e2e checkout --repl

# CI-style run with retries
npx jest-e2e --retries 2

# Raise the timeout for a slow environment
npx jest-e2e --timeout 15000
```

## What init does

`npx jest-e2e init` (or the automatic first run) sets up a project:

- Adds `"type": "module"`, Jest configuration, and npm scripts to `package.json`
- Creates `__tests__/` with four example tests that run against a live demo app
- Creates `databuilders/` with base and example builders
- Creates `config/test-setup.js` wiring the framework's globals, step logging, and one-test-per-file enforcement
- Copies `jest-puppeteer.config.js`
- Adds `__screenshots__/` to `.gitignore`

After init:

```bash
npm install
npx jest-e2e
```

## Visible-browser behavior

`--useLocalBrowser`, `--repl`, and `--slowmo` all imply:

- A single Jest worker (one browser window)
- **Smooth mode** — a short delay between actions and disabled CSS animations, so the run is watchable
- Step logging forced on
