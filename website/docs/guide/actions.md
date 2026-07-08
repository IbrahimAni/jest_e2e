---
id: actions
title: Actions
sidebar_position: 3
---

# Actions

Actions drive the browser: navigate, click, type, fill. Before performing an action, the device automatically:

1. Waits for the element to appear in the DOM
2. Scrolls it into view
3. Waits until it is visible, has size, and is not disabled

If any of that doesn't happen within the timeout (default **5 seconds**), the action fails with a [detailed error](/guide/debugging#reading-failures). You never need to sleep or poll before acting.

## Navigation

```javascript
await device.navigate('https://your-app.com');
await device.navigate(url, { waitUntil: 'networkidle0' }); // wait for network to settle

await device.goBack();
await device.goForward();
await device.refresh();
```

:::tip
Use `{ waitUntil: 'networkidle0' }` for pages that load data after the initial render. It waits until the network has been quiet for 500ms.
:::

## Clicking

```javascript
await device.click('add-to-cart');
await device.click('menu-item', { waitTimeout: 10000 }); // custom wait for this action
```

## Typing vs filling

There are two ways to put a value in a field. Choose based on the input type:

**`type()`** presses keys one at a time, like a real user. Use it for ordinary text inputs — it triggers every `keydown`/`keyup` your app listens to. Note that it *appends* to the current value.

```javascript
await device.type('email-input', 'user@example.com');
```

**`fill()`** sets the value directly and fires `input` and `change` events. Use it for **date, time, and number inputs**, where keyboard typing depends on the user's locale, or when you need to *replace* a value:

```javascript
await device.fill('reserve-date', '2026-07-10');
await device.fill('reserve-time', '19:00');
await device.fill('quantity', 4);
```

**`clear()`** empties a field:

```javascript
await device.clear('email-input');
await device.type('email-input', 'corrected@example.com');
```

## Keyboard

Press a key on an element — useful for submitting forms with Enter or dismissing dialogs with Escape:

```javascript
await device.press('login-password', 'Enter');
await device.press('search-input', 'Escape');
```

Any [Puppeteer key name](https://pptr.dev/api/puppeteer.keyinput) works: `'Enter'`, `'Tab'`, `'ArrowDown'`, `'Escape'`, and so on.

## Select dropdowns

```javascript
await device.select('country', 'GB');           // single value
await device.select('toppings', ['a', 'b']);    // multi-select
```

## Hover

```javascript
await device.hover('user-menu');
await device.click('logout-option');
```

## Waiting

Auto-waiting covers most cases, but sometimes you need to wait for something that isn't the target of an action:

```javascript
await device.waitFor('spinner', { hidden: true }); // wait for element to disappear
await device.waitForText('status', 'Complete');    // wait for text to appear
await device.waitForUrl('/dashboard');             // wait for URL to contain a pattern
await device.waitForNavigation();                  // wait for a page load
```

:::caution
`device.wait(ms)` — a plain sleep — exists, but reach for it last. Fixed sleeps make tests slow when they pass and flaky when the app is slower than the sleep. Prefer waiting on a condition.
:::

## Reading the page

```javascript
const text = await device.getText('order-total');    // element text content
const value = await device.getValue('email-input');  // input value
const url = device.url();                            // current URL
const title = await device.title();                  // page title
const exists = await device.exists('banner');        // true/false, no waiting
```

For verifying page state, prefer [assertions](/guide/assertions) over reading values and comparing them yourself — assertions retry automatically and produce better failure messages.
