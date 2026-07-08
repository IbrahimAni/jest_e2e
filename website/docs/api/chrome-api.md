---
id: chrome-api
title: ChromeE2EApi
sidebar_position: 4
---

# ChromeE2EApi

`createChromeE2EApi(options?)` creates a [device](/api/device) with Chrome-specific extras: network interception, cookies, performance metrics, and mobile emulation.

```javascript
const device = createChromeE2EApi({
  slowMo: 0,          // per-keystroke typing delay (ms)
  viewport: { width: 1280, height: 720 },
});
```

It has every base device method, plus the following.

## Network

### interceptNetwork(rules)

Blocks or mocks requests by URL pattern. Calling it again replaces the previous rules.

```javascript
// Block requests (shorthand: array of patterns)
await device.interceptNetwork(['analytics.google.com', 'tracker.js']);

// Mock an API response
await device.interceptNetwork([
  {
    pattern: '/api/users',
    action: 'mock',
    response: {
      status: 200,
      contentType: 'application/json',
      body: { users: [{ id: 1, name: 'Test User' }] },
    },
  },
  { pattern: 'ads.example.com', action: 'block' },
]);
```

Requests matching no rule continue normally.

### waitForResponse(urlPattern, timeout?)

Waits for a network response whose URL contains `urlPattern` and returns it.

```javascript
const response = await device.waitForResponse('/api/orders');
expect(response.status()).toBe(200);
```

### waitForRequest(urlPattern, timeout?)

Same, for outgoing requests.

## Cookies

```javascript
await device.addCookie({ name: 'session', value: 'abc123', domain: 'your-app.com' });
const cookies = await device.getCookies();
await device.clearCookies();
```

## Mobile

```javascript
await device.setMobileViewport();          // 375×667, isMobile: true
await device.setMobileViewport(414, 896);  // custom size
await device.simulateTouch();              // enable touch events via CDP
await device.tap('menu-button');           // touch tap
await device.emulateDevice(devices['iPhone 13']); // full Puppeteer device profile
```

## Diagnostics

### getPerformanceMetrics()

Returns Chrome metrics (`JSHeapUsedSize`, `firstContentfulPaint`, and the rest of `page.metrics()`).

```javascript
const metrics = await device.getPerformanceMetrics();
expect(metrics.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024);
```

### debug(message) / log(level, message)

Writes a message into the browser's console — useful for correlating test steps with app logs when debugging headed.

## screenshot(options?)

Same as the base device, with safe defaults: PNG type, viewport-sized. Pass `{ type: 'jpeg', quality: 80 }` for compressed captures or `{ fullPage: true }` for the whole page.
