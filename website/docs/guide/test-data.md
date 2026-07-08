---
id: test-data
title: Test data
sidebar_position: 5
---

# Test data

Test data lives in **data builders** — small classes that generate everything a test needs: URLs, credentials, form values. Tests stay readable because the "what" (data) is separated from the "how" (steps).

## Using a data builder

Pass a builder to `E2ESetup`, then read it with `getTestData()`:

```javascript
import { TavolaDataBuilder } from '../databuilders/tavola-data-builder.js';

const { getTestData, getDevices } = E2ESetup({
  databuilder: TavolaDataBuilder(),
  devices: { device: createChromeE2EApi({}) },
});

test('User can sign in', async () => {
  const { device } = getDevices();
  const { loginUrl, username, password } = getTestData();

  await device.navigate(loginUrl);
  await device.type('login-username', username);
  await device.type('login-password', password);
  // ...
});
```

## Writing a data builder

Extend `BaseDataBuilder` and implement `genImp()` — it runs in the constructor and populates the instance:

```javascript title="databuilders/shop-data-builder.js"
import { BaseDataBuilder } from './base-data-builder.js';

class genShopDataBuilder extends BaseDataBuilder {
  constructor() {
    super();
    this.name = 'ShopDataBuilder';
    this.version = '1';
    this.genImp();
  }

  /** @override */
  genImp() {
    this.baseUrl = 'https://shop.example.com';
    this.loginUrl = `${this.baseUrl}/login`;

    this.username = 'test-user';
    this.password = 'test-password';

    // Dynamic data: generate what must be unique per run
    const stamp = Date.now();
    this.newAccountEmail = `e2e-${stamp}@example.com`;

    return this;
  }
}

export function ShopDataBuilder() {
  return new genShopDataBuilder();
}
```

Export a factory function (not the class) so each test file gets a fresh instance.

## Guidelines

**Compute dates, don't hardcode them.** A hardcoded "future" date becomes a past date eventually:

```javascript
const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
this.reservationDate = future.toISOString().slice(0, 10); // always 3 days ahead
```

**Make unique what must be unique.** Sign-up flows fail on the second run if the email is fixed — derive it from a timestamp.

**Keep environment URLs in one place.** When the staging URL changes, you edit one builder, not twenty tests.

**Don't put steps in builders.** Builders hold data. Page interactions belong in tests.
