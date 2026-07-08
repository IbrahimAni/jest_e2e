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
| `timeout` | number | `5000` | Auto-wait timeout (ms) for all actions and assertions |
| `retries` | number | `0` | Retry the test on failure this many times |
| `screenshotOnFailure` | boolean | `true` | Save a full-page screenshot to `__screenshots__/` when the test fails |
| `smoothMode` | boolean | auto | Add a small delay between actions and disable CSS animations (on automatically in headed/REPL/slowmo runs) |
| `actionDelay` | number | auto | Delay (ms) between actions when smooth mode is on |
| `disableAnimations` | boolean | auto | Inject CSS to zero out animations and transitions |

Environment variables set by the [CLI](/api/cli) (`JEST_E2E_TIMEOUT`, `JEST_E2E_RETRIES`, `JEST_E2E_SCREENSHOT`, `JEST_E2E_SMOOTH`) act as fallbacks; explicit config always wins.

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
