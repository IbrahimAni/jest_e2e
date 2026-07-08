---
id: assertions
title: Assertions
sidebar_position: 2
---

# Assertions

`device.expect(selector, options?)` returns an assertion object. Every assertion is async, retries until it passes or the timeout elapses, and supports `.not`.

```javascript
await device.expect('cart-badge').toHaveText('1');
await device.expect('cart-badge', { waitTimeout: 10000 }).toHaveText('1');
await device.expect('spinner').not.toBeVisible();
```

## toContain(text)

Passes when the element's text content contains `text`.

```javascript
await device.expect('welcome-banner').toContain('Emily');
```

## toHaveText(text)

Passes when the element's trimmed text content equals `text` exactly.

```javascript
await device.expect('cart-qty-1-value').toHaveText('2');
```

## toBeVisible()

Passes when the element is in the DOM and visible (not `display: none` or `visibility: hidden`).

`.not.toBeVisible()` passes when the element is hidden **or absent** — and waits for it to become so.

```javascript
await device.expect('modal').toBeVisible();
await device.expect('spinner').not.toBeVisible(); // waits for the spinner to go away
```

## toExist()

Passes when the element is present in the DOM, visible or not.

`.not.toExist()` passes when the element is absent — and waits for it to be removed.

```javascript
await device.expect('cart-line-1').toExist();
await device.click('cart-remove-1');
await device.expect('cart-line-1').not.toExist(); // waits for removal
```

## toHaveValue(value)

Passes when the input's value equals `value`.

```javascript
await device.expect('email-input').toHaveValue('user@example.com');
```

## toHaveAttribute(name, value)

Passes when the element's attribute `name` equals `value`.

```javascript
await device.expect('nav-link-home').toHaveAttribute('data-active', 'true');
```

## toHaveClass(className)

Passes when the element's class list contains `className`.

```javascript
await device.expect('alert').toHaveClass('alert-error');
```

## toHaveCount(count)

Passes when the number of elements matching the selector equals `count`. Polls the count directly, so `toHaveCount(0)` works even if the element never existed.

```javascript
await device.expect('[data-testid^="dish-card-"]').toHaveCount(12);
await device.expect('error-message').toHaveCount(0);
```

## Failure output

Failed assertions throw with expected/actual values and the page URL:

```
Assertion "toHaveText" failed for "cart-badge" (resolved to "[data-testid="cart-badge"]")
  Expected: to equal "2"
  Actual: 1
  Page URL: https://your-app.com/cart
```
