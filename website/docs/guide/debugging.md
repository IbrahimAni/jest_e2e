---
id: debugging
title: Debugging
sidebar_position: 6
---

# Debugging

When a test fails, work through these in order: read the error, watch the browser, keep the browser open.

## Reading failures

Failures include the context you need before you reach for a browser. A missed selector lists every `data-testid` on the page:

```
Click failed for "submit-btn" (resolved to "[data-testid="submit-btn"]")
  Page URL: https://your-app.com/login
  Available data-testid values: ["login-username", "login-password", "login-submit"]
  Original error: Waiting for selector failed: 5000ms exceeded
```

A failed assertion shows expected vs. actual:

```
Assertion "toContain" failed for "status" (resolved to "[data-testid="status"]")
  Expected: to contain "Complete"
  Actual: Processing your order…
  Page URL: https://your-app.com/orders/42
```

Most failures are solved right here — a typo'd test id, a copy change, a redirect you didn't expect.

## Failure screenshots

Every failed test saves a full-page screenshot to `__screenshots__/`, named after the test and timestamp:

```
__screenshots__/user-can-sign-in-2026-07-08T10-30-00-000Z.png
```

Screenshots are on by default. Disable per run with `--no-screenshot`, or per file with `E2ESetup({ screenshotOnFailure: false })`.

## Watch the browser

Run headed to see what the test sees:

```bash
npx jest-e2e login --useLocalBrowser
```

Headed mode automatically enables **smooth mode**, which makes the run easy to follow:

- An **orange cursor** overlay shows where the mouse is at all times
- The cursor **glides** to each element instead of teleporting, and every click pulses a ripple
- The target element flashes an **orange outline** just before it's acted on
- Off-screen elements are scrolled to **smoothly**, and typing happens keystroke by keystroke

Slow it down further when needed:

```bash
npx jest-e2e login --slowmo 200   # 200ms between every action
```

## Keep the browser open (REPL mode)

The browser normally closes when the test ends — including at the exact moment things went wrong. REPL mode leaves it open:

```bash
npx jest-e2e login --repl
```

The test runs headed, and when it finishes the browser window stays where the test left it. Inspect the DOM, check the network tab, poke at the app — then close the window yourself.

## Step logging

Every device action prints a live, single-line progress indicator:

```
📍 Typing "emilys" into "login-username" [2.31s]
```

When a test fails, the last step tells you exactly where it stopped. Control it with:

```bash
npx jest-e2e --no-steps    # keep other output, hide steps
npx jest-e2e --silent      # hide everything but results
```

In CI, step logging is off by default (set `JEST_FORCE_STEPS=true` to force it on).

## Retrying flaky tests

While you fix the root cause, retries keep the suite green:

```bash
npx jest-e2e --retries 2
```

or per file:

```javascript
E2ESetup({ retries: 2, /* ... */ });
```

Failures are logged before each retry, so a flaky-but-passing run still shows you what happened.

## Verbose Jest output

`--verbose` passes through to Jest and disables the summary filtering:

```bash
npx jest-e2e login --debug --verbose
```

`--debug` additionally enables `--detectOpenHandles` to find hanging resources.
