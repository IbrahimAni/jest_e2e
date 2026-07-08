---
id: assertions
title: Assertions
sidebar_position: 4
---

# Assertions

Use `device.expect(selector)` to verify page state. Assertions **retry automatically** until they pass or the timeout elapses (default **5 seconds**) — so you can assert immediately after an action, even if the app updates asynchronously.

```javascript
await device.click('add-to-cart');
await device.expect('cart-badge').toHaveText('1'); // retries while the badge updates
```

Always `await` assertions. They are async.

## Available assertions

```javascript
await device.expect('title').toContain('Welcome');          // text contains
await device.expect('title').toHaveText('Welcome back');    // exact text (trimmed)
await device.expect('modal').toBeVisible();                 // visible on the page
await device.expect('banner').toExist();                    // present in the DOM
await device.expect('email').toHaveValue('a@b.com');        // input value
await device.expect('link').toHaveAttribute('href', '/home'); // attribute value
await device.expect('alert').toHaveClass('error');          // class list contains
await device.expect('list-item').toHaveCount(3);            // number of matches
```

## Negating with `.not`

Every assertion can be inverted. Negated existence and visibility checks **wait for the condition to become true** — they don't just check once:

```javascript
await device.click('cart-remove-1');

await device.expect('cart-line-1').not.toExist();    // waits until removed from the DOM
await device.expect('spinner').not.toBeVisible();    // waits until hidden or gone
await device.expect('status').not.toContain('Error');
```

This makes "assert the thing went away" reliable without any manual waiting.

## Counting elements

`toHaveCount` polls the match count directly, so asserting **zero** works even when no element ever existed:

```javascript
await device.expect('search-result').toHaveCount(10);
await device.expect('error-message').toHaveCount(0);
```

Combine with CSS attribute selectors for pattern matching:

```javascript
await device.expect('[data-testid^="dish-card-"]').toHaveCount(12);
```

## Timeouts

Pass a custom timeout for a single assertion:

```javascript
await device.expect('report-status', { waitTimeout: 30000 }).toContain('Ready');
```

Or change the default for the whole file via [`E2ESetup`](/api/e2e-setup):

```javascript
E2ESetup({ timeout: 10000, /* ... */ });
```

## Reading failures

A failed assertion reports what was expected, what was actually there, and where:

```
Assertion "toHaveText" failed for "cart-badge" (resolved to "[data-testid="cart-badge"]")
  Expected: to equal "2"
  Actual: 1
  Page URL: https://your-app.com/cart
```

The stack trace points at your test file, not framework internals.

## Assertions vs. reading values

You *can* read a value and assert with plain Jest:

```javascript
// Works, but doesn't retry — races against async updates
const text = await device.getText('cart-badge');
expect(text).toBe('1');
```

Prefer the device assertion — it retries until the timeout and fails with page context:

```javascript
await device.expect('cart-badge').toHaveText('1');
```

Use plain Jest `expect` for things that aren't page state: URLs, values you've already captured, data-builder contents.
