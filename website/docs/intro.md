---
id: intro
title: Getting started
sidebar_position: 1
slug: /
---

# Getting started

Jest E2E is an end-to-end testing framework built on [Jest](https://jestjs.io) and [Puppeteer](https://pptr.dev). It gives you a single `device` object for driving the browser, auto-waiting on every action and assertion, and a zero-config CLI.

```javascript
test('User can sign in', async () => {
  const { device } = getDevices();

  await device.navigate('https://your-app.com/login');
  await device.type('login-username', 'emilys');
  await device.type('login-password', 'emilyspass');
  await device.click('login-submit');

  await device.expect('account-name').toContain('Emily Johnson');
});
```

No manual waits. No selector boilerplate. `'login-username'` targets `[data-testid="login-username"]` automatically, and every action waits for its element to be visible and enabled before running.

## Installation

Install the package, then run the CLI once:

```bash
npm install --save-dev jest-e2e
npx jest-e2e
```

The first run detects that your project isn't set up yet and initializes it:

- Updates `package.json` with ES module support and Jest configuration
- Creates `__tests__/` with four working example tests
- Creates `databuilders/` for test data and `config/` for setup
- Adds npm scripts: `jest-e2e`, `jest-e2e:visible`, `jest-e2e:watch`

:::note
Jest E2E requires Node.js 16 or later. Chrome is downloaded automatically by Puppeteer.
:::

## Run your first test

The example tests run against a live demo app, so they work immediately:

```bash
# Run all tests (headless)
npx jest-e2e

# Run one test, watching the browser
npx jest-e2e tavola-login --useLocalBrowser
```

You'll see each step logged in real time as the test runs:

```
🧪 Starting test: User sees an error on bad credentials, then signs in with Enter key
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Typing "emilys" into "login-username" [2.31s]
```

## Core concepts

Jest E2E is opinionated. Three conventions do most of the work:

**One test per file.** Each test file contains exactly one `test()` — the framework enforces this. Small, focused files are easier to run, retry, and debug in isolation.

**Smart selectors.** Plain strings target `data-testid` attributes; anything that looks like CSS passes through unchanged. See [Locating elements](/guide/locating-elements).

**Data builders.** Test data lives in builder classes, not inline in tests. See [Test data](/guide/test-data).

## Next steps

- [Writing tests](/guide/writing-tests) — test structure, `E2ESetup`, lifecycle hooks
- [Actions](/guide/actions) — clicking, typing, filling forms
- [Assertions](/guide/assertions) — the auto-retrying `expect` API
- [Debugging](/guide/debugging) — visible browser, REPL mode, failure screenshots
