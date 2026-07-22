---
id: e2e-setup
title: E2ESetup
sidebar_position: 3
---

# E2ESetup

`E2ESetup(config)` configures a test file. Call it once at the top of the file; it returns accessors for your devices and test data, plus lifecycle hooks.

```javascript
const { getTestData, getDevices } = E2ESetup({
  databuilder: MyDataBuilder(),
  devices: { device: createChromeE2EApi({}) },
  timeout: 10000,
  retries: 2,
});
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `databuilder` | object | `null` | Test data instance, returned by `getTestData()` |
| `devices` | object | `{}` | Named devices, returned by `getDevices()` |
| `auth` | object/array/string/false | env auto-detect | Automation auth for protected deployments |
| `timeout` | number | `5000` | Auto-wait timeout (ms) for all actions and assertions |
| `retries` | number | `0` | Retry the test on failure this many times |
| `screenshotOnFailure` | boolean | `true` | Save a full-page screenshot to `__screenshots__/` when the test fails |
| `smoothMode` | boolean | auto | Add a small delay between actions and disable CSS animations (on automatically in headed/REPL/slowmo runs) |
| `actionDelay` | number | auto | Delay (ms) between actions when smooth mode is on |
| `disableAnimations` | boolean | auto | Inject CSS to zero out animations and transitions |

Environment variables set by the [CLI](/api/cli) (`JEST_E2E_TIMEOUT`, `JEST_E2E_RETRIES`, `JEST_E2E_SCREENSHOT`, `JEST_E2E_SMOOTH`) act as fallbacks; explicit config always wins.

## Auth for protected deployments

`auth` injects headers, query params, or cookies before `device.navigate()`. It is designed for protected preview/staging deployments where an automation key is already available.

### Vercel Deployment Protection

Set the bypass secret from **Protection Bypass for Automation** in your shell or CI secret store:

```bash
export VERCEL_AUTOMATION_BYPASS_SECRET="your-vercel-bypass-secret"
npx jest-e2e
```

When `VERCEL_AUTOMATION_BYPASS_SECRET` is present, `E2ESetup(...)` automatically sends `x-vercel-protection-bypass` and `x-vercel-set-bypass-cookie: true` to `*.vercel.app` and `*.vercel.sh` URLs. The bypass cookie keeps later in-browser navigation from returning to the Vercel login page.

To keep auth out of test files, create `jest-e2e.config.js` in the project root:

```javascript
import { defineConfig } from 'jest-e2e';

// Optional .env support:
// 1. Run: npm install --save-dev dotenv
// 2. Uncomment the next line.
// import 'dotenv/config';

export default defineConfig({
  auth: {
    provider: 'vercel',
    token: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
  },
});
```

Then create `.env` locally:

```bash
VERCEL_AUTOMATION_BYPASS_SECRET=your-vercel-bypass-secret
```

Your tests can stay focused on devices and data:

```javascript
E2ESetup({
  devices: { device: createChromeE2EApi({}) },
});
```

### Generic automation auth

For other systems, provide the auth material your gateway expects:

```javascript
import { defineConfig } from 'jest-e2e';

// import 'dotenv/config';

export default defineConfig({
  auth: {
    headers: {
      'x-automation-key': process.env.AUTOMATION_KEY,
    },
    queryParams: {
      preview: '1',
    },
    cookies: [
      { name: 'session', value: process.env.SESSION_COOKIE },
    ],
    urlPatterns: ['staging.example.com'],
  },
});
```

Environment-only generic header auth is also supported:

```bash
export JEST_E2E_AUTH_HEADER_NAME="x-automation-key"
export JEST_E2E_AUTOMATION_KEY="your-automation-key"
npx jest-e2e
```

Use `urlPatterns` to scope credentials to matching hosts or full URL wildcards. Pass `{ auth: false }` to a single `device.navigate()` call when a navigation should not use configured auth.

## Returned object

### getTestData()

Returns the data builder instance passed in `config.databuilder`.

### getDevices()

Returns the devices object. Destructure by the names you registered:

```javascript
const { device } = getDevices();
```

### Lifecycle hooks

`beforeEach(fn)`, `afterEach(fn)`, `beforeAll(fn)`, `afterAll(fn)` — register hooks that run at the corresponding Jest lifecycle point. Each hook receives `(devices, testData)`. Multiple hooks per event run in registration order.

```javascript
const setup = E2ESetup({ /* ... */ });

setup.beforeEach(async (devices, data) => {
  await devices.device.navigate(data.baseUrl);
});
```

### Device management

```javascript
setup.addDevice('mobile', createChromeE2EApi({}));
setup.getDevice('mobile');
setup.removeDevice('mobile');
```

### Other

- `setDataBuilder(builder)` — replace the test data
- `setEnvironment(env)` / `getEnvironment()` — tag the run (`'test'` by default)
- `updateConfig(partial)` — merge new config
- `debug()` — snapshot of the current configuration
- `reset()` — clear all state
