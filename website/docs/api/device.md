---
id: device
title: Device
sidebar_position: 1
---

# Device

The device is the object your tests use to drive the browser. Create one with `createChromeE2EApi()` and register it in [`E2ESetup`](/api/e2e-setup).

All selector parameters are [smart selectors](/guide/locating-elements). All methods that accept `options` accept `{ waitTimeout: ms }` to override the auto-wait timeout (default 5000ms, configurable via `E2ESetup({ timeout })`).

## Navigation

### navigate(url, options?)

Navigates to a URL. Options pass through to Puppeteer's `page.goto` — most commonly `waitUntil`:

```javascript
await device.navigate('https://your-app.com');
await device.navigate(url, { waitUntil: 'networkidle0' });
```

When created via `createChromeE2EApi`, `waitUntil: 'networkidle0'` and a 30s navigation timeout are the defaults.

### goBack(options?) / goForward(options?) / refresh(options?)

Browser history navigation and reload.

```javascript
await device.goBack();
await device.refresh();
```

## Interactions

All interactions auto-wait for the element to be visible, scrolled into view, and enabled.

### click(selector, options?)

```javascript
await device.click('add-to-cart');
```

### type(selector, text, options?)

Types text with key events, appending to the current value. Pass `{ delay: ms }` for per-keystroke delay.

```javascript
await device.type('email-input', 'user@example.com');
```

### fill(selector, value, options?)

Sets a field's value directly and fires `input` and `change` events. Replaces the current value. Works with text, date, time, and number inputs, textareas, selects, and contenteditable elements.

```javascript
await device.fill('reserve-date', '2026-07-10');
```

### clear(selector, options?)

Empties an input or textarea, firing `input` and `change`.

```javascript
await device.clear('email-input');
```

### press(selector, key, options?)

Presses a keyboard key on an element. Accepts any [Puppeteer key name](https://pptr.dev/api/puppeteer.keyinput).

```javascript
await device.press('login-password', 'Enter');
```

### select(selector, value, options?)

Selects `<select>` option(s) by value. Pass an array for multi-selects.

```javascript
await device.select('country', 'GB');
```

### hover(selector, options?)

```javascript
await device.hover('user-menu');
```

## Waiting

### waitFor(selector, options?)

Waits for an element. Options pass to Puppeteer's `waitForSelector` (`visible`, `hidden`).

```javascript
await device.waitFor('results');
await device.waitFor('spinner', { hidden: true });
```

### waitForText(selector, text, options?)

Waits until the element's text contains `text`.

```javascript
await device.waitForText('status', 'Complete');
```

### waitForUrl(pattern, options?)

Waits until the page URL contains `pattern`.

```javascript
await device.waitForUrl('/dashboard');
```

### waitForNavigation(options?)

Waits for a page navigation to finish.

### wait(ms)

Plain sleep. Prefer condition-based waits.

## Queries

### getText(selector, options?) → string

Returns the element's text content.

### getValue(selector, options?) → string

Returns an input's value.

### get(selector, options?) → ElementHandle

Returns the Puppeteer element handle for advanced use.

### getAll(selector, options?) → ElementHandle[]

Returns all matching element handles.

### exists(selector) → boolean

Returns whether the element is in the DOM **right now**. Does not wait.

### isVisible(selector) → boolean

Returns whether the element currently intersects the viewport. Does not wait.

:::tip
For verification, prefer [`device.expect()`](/api/assertions) over `exists`/`isVisible` — assertions retry and produce better failures.
:::

## Page utilities

```javascript
device.url();                    // current URL (string, synchronous)
await device.title();            // page title
await device.content();          // full page HTML
await device.evaluate(fn);       // run a function in the page
await device.screenshot(opts);   // take a screenshot
```

## expect(selector, options?)

Entry point to the assertion API. See [Assertions](/api/assertions).

## css

Raw CSS methods that bypass smart selectors and auto-waiting: `css.click`, `css.type`, `css.waitFor`, `css.get`, `css.getAll`, `css.getText`, `css.exists`.
