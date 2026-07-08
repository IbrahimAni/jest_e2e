---
id: writing-tests
title: Writing tests
sidebar_position: 1
---

# Writing tests

Every Jest E2E test file follows the same shape: configure once with `E2ESetup()`, then write one `test()`.

```javascript title="__tests__/login-e2e.js"
import { MyDataBuilder } from '../databuilders/my-data-builder.js';

const { getTestData, getDevices } = E2ESetup({
  databuilder: MyDataBuilder(),
  devices: {
    device: createChromeE2EApi({}),
  },
});

test('User can sign in', async () => {
  const { device } = getDevices();
  const { username, password } = getTestData();

  await device.navigate('https://your-app.com/login');
  await device.type('login-username', username);
  await device.type('login-password', password);
  await device.click('login-submit');

  await device.expect('account-name').toContain('Emily');
});
```

`E2ESetup` and `createChromeE2EApi` are available as globals in every test file — no imports needed.

## File naming

Test files must end in `-e2e.js` (or `.test.js` / `.spec.js`) and live in `__tests__/`:

```
__tests__/
├── login-e2e.js
├── add-to-cart-e2e.js
└── checkout-e2e.js
```

## One test per file

The framework allows exactly one `test()` per file. A second `test()` fails immediately with a clear error.

This keeps every scenario independently runnable — `npx jest-e2e add-to-cart` runs one focused flow, and a retry re-runs only that flow. If you're tempted to add a second test, create a second file instead.

## Configuration

`E2ESetup()` accepts everything a test file needs:

```javascript
const { getTestData, getDevices } = E2ESetup({
  databuilder: MyDataBuilder(),   // test data (see Test data guide)
  devices: {
    device: createChromeE2EApi({}),
  },
  timeout: 10000,                 // auto-wait timeout for all actions (default: 5000ms)
  retries: 2,                     // retry this test on failure (default: 0)
  screenshotOnFailure: true,      // save a screenshot when the test fails (default: true)
});
```

See the [E2ESetup API](/api/e2e-setup) for all options.

## Lifecycle hooks

Register hooks on the setup object. Each hook receives your devices and test data:

```javascript
const setup = E2ESetup({
  databuilder: MyDataBuilder(),
  devices: { device: createChromeE2EApi({}) },
});

setup.beforeEach(async (devices, data) => {
  await devices.device.navigate(data.baseUrl);
});

setup.afterAll(async (devices, data) => {
  // clean up test records, sign out, etc.
});
```

`beforeEach`, `afterEach`, `beforeAll`, and `afterAll` are all supported, and you can register more than one of each — they run in registration order.

## A complete example

This test runs against the demo app that ships with the framework. It covers a full user flow: add an item, change quantity, remove it.

```javascript title="__tests__/tavola-cart-e2e.js"
import { TavolaDataBuilder } from '../databuilders/tavola-data-builder.js';

const { getTestData, getDevices } = E2ESetup({
  databuilder: TavolaDataBuilder(),
  devices: { device: createChromeE2EApi({}) },
});

test('User can add a dish to the cart, change quantity, and remove it', async () => {
  const { device } = getDevices();
  const { menuUrl, cartUrl } = getTestData();

  await device.navigate(menuUrl, { waitUntil: 'networkidle0' });

  const dishName = await device.getText('dish-name-1');
  await device.click('add-to-cart-1');

  await device.expect('toast').toBeVisible();
  await device.expect('cart-badge').toHaveText('1');

  await device.navigate(cartUrl, { waitUntil: 'networkidle0' });
  await device.click('cart-qty-1-inc');
  await device.expect('cart-qty-1-value').toHaveText('2');

  await device.click('cart-remove-1');
  await device.expect('cart-line-1').not.toExist();
  await device.expect('cart-empty').toExist();
});
```

Notice what's *not* here: no `sleep()`, no manual `waitForSelector`, no try/catch. Auto-waiting handles the timing; [enhanced errors](/guide/debugging#reading-failures) handle the failures.

## A multi-page journey

A single test can span an entire flow across many pages. This example — one of the examples shipped with the framework — signs in, carries a cart across the authentication boundary, and drives all the way to a ready-to-pay checkout:

```javascript title="__tests__/tavola-checkout-journey-e2e.js"
test("Guest adds a dish, signs in, and reaches a ready-to-pay checkout", async () => {
  const { device } = getDevices();
  const { menuUrl, loginUrl, cartUrl, checkoutUrl, username, password,
          accountName, checkoutEmail, deliveryPhone, deliveryAddress } = getTestData();

  // Add a dish as a guest
  await device.navigate(menuUrl, { waitUntil: "networkidle0" });
  const dishName = (await device.getText("dish-name-1")).trim();
  await device.click("add-to-cart-1");
  await device.expect("cart-badge", { waitTimeout: 15000 }).toBeVisible();

  // Sign in — the guest cart merges into the account
  await device.navigate(loginUrl, { waitUntil: "networkidle0" });
  await device.type("login-username", username);
  await device.type("login-password", password);
  await device.click("login-submit");
  await device.waitForUrl("/account", { waitTimeout: 15000 });

  // The merged cart still holds the dish
  await device.navigate(cartUrl, { waitUntil: "networkidle0" });
  await device.expect("cart-line-1").toExist();

  // Checkout is pre-filled from the account; add delivery details
  await device.navigate(checkoutUrl, { waitUntil: "networkidle0" });
  await device.expect("input-name").toHaveValue(accountName);
  await device.fill("input-phone", deliveryPhone);
  await device.fill("input-address", deliveryAddress);
  await device.expect("place-order").toContain("Place order");
  await device.click("place-order");
});
```

The whole flow lives in one file with one `test()` — the framework's one-test-per-file rule keeps each journey self-contained and independently runnable.
