---
id: locating-elements
title: Locating elements
sidebar_position: 2
---

# Locating elements

Every device method takes a **smart selector** — a single string that is interpreted one of two ways:

1. **A plain string** targets a `data-testid` attribute.
2. **Anything that looks like CSS** is used as a CSS selector, unchanged.

```javascript
await device.click('submit-btn');        // → [data-testid="submit-btn"]
await device.click('#submit');           // → #submit (CSS id)
await device.click('.btn-primary');      // → .btn-primary (CSS class)
await device.click('form > button');     // → CSS combinator
await device.click('[aria-label="Close"]'); // → CSS attribute selector
await device.click('button');            // → HTML element name
```

## Why test ids first

Test ids are stable. Classes change with styling, text changes with copy edits, and DOM structure changes with refactors — but a `data-testid` only changes when someone deliberately breaks the contract with the test suite.

Add test ids to the elements your tests touch:

```html
<button data-testid="login-submit">Sign in</button>
```

Then the test reads exactly like the intent:

```javascript
await device.click('login-submit');
```

## What counts as CSS

A selector passes through as CSS when it starts with `.` or `#`, or contains `[`, `>`, a space, `:`, or `*` — or when it is a bare HTML element name (`body`, `button`, `input`, and so on).

```javascript
await device.expect('body').toContain('Welcome');          // element name
await device.expect('[data-testid^="dish-card-"]').toHaveCount(12); // attribute prefix match
await device.waitFor('input:focus');                        // pseudo-class
```

:::tip
`data-testid` values with spaces or colons would be misread as CSS. Stick to kebab-case ids like `cart-badge` or `dish-card-1`.
:::

## When a selector fails

If an element can't be found, the error tells you the page URL and **every `data-testid` present on the page** — usually enough to spot the typo without opening a browser:

```
Click failed for "submit-btn" (resolved to "[data-testid="submit-btn"]")
  Page URL: https://your-app.com/login
  Available data-testid values: ["login-username", "login-password", "login-submit"]
  Original error: Waiting for selector failed: 5000ms exceeded
```

Here the fix is obvious: the button's test id is `login-submit`, not `submit-btn`.

## Escaping to raw CSS

If you need to bypass smart-selector interpretation entirely, use `device.css`:

```javascript
await device.css.click('.legacy-btn');
const text = await device.css.getText('#status');
```

The `css` namespace calls Puppeteer directly and does not auto-wait — prefer the main device methods unless you have a reason.
