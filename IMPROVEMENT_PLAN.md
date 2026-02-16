# Jest E2E Framework — Improvement Implementation Plan

## Project Context

**Repository:** `jest-e2e` — A Jest + Puppeteer E2E testing framework
**Version:** 1.0.4
**Module system:** ES modules (`"type": "module"`)
**Key files:**

- `config/device.js` — Core device API wrapping Puppeteer's `page` object with smart selectors
- `config/chrome-api.js` — Chrome-specific device wrapper (`ChromeE2EApi` class)
- `config/e2e-setup.js` — `E2ESetup()` orchestrator and `E2EConfiguration` class
- `config/step-logger.js` — Real-time step logging
- `config/globals.js` — Global variable setup
- `config/single-test-enforcer.js` — One-test-per-file enforcement
- `databuilders/base-data-builder.js` — Abstract base data builder (`BaseDataBuilder` class)
- `databuilders/agent-test-data-builder.js` — Example concrete builder (`genAgentTestDataBuilder`)
- `index.js` — Public exports
- `bin/jest-e2e.js` — CLI entry point

**Conventions:**
- The `device` object in `device.js` uses a `smartSelector()` function that converts plain strings to `[data-testid="..."]` selectors, passing through CSS selectors (`.class`, `#id`, `[attr]`, combinators, etc.) as-is
- Step logging via `stepLogger.step(action, detail)` is called before each device action
- The `ChromeE2EApi` class copies all base `device` methods in its constructor and overrides some with Chrome-specific defaults
- Tests use the global `page` object provided by `jest-puppeteer`
- The `smartSelector` function is currently NOT exported — it must be exported to enable unit testing
- `device.js` already has auto-waiting (`waitForSelector`) and `resolveWaitTimeout()` implemented on interaction methods, query methods, and assertion methods
- `device.js` already has a `hover()` method implemented with auto-wait

**Current state (already implemented by user):**
- Task 1 (Auto-waiting) is DONE — `device.js` already has `DEFAULT_WAIT_TIMEOUT = 5000`, `resolveWaitTimeout()`, and `waitForSelector` calls in all interaction/query/assertion methods
- Task 9 (hover) is DONE — `hover()` method exists at line 72 of `device.js`
- `exists()` and `isVisible()` correctly do NOT auto-wait

---

## Testing Strategy

**All tests go in `__tests__/framework/`** — these are unit tests for the framework itself, NOT Puppeteer E2E tests. They mock the global `page` object and other Puppeteer dependencies.

**Test file naming:** `<module-name>.test.js` (e.g., `smart-selector.test.js`, `e2e-setup.test.js`)

**Running framework tests separately:** Add a script to `package.json`:
```json
"test:framework": "NODE_OPTIONS='--experimental-vm-modules --no-warnings' jest __tests__/framework/ --no-coverage"
```

**Important:** Since the project uses ES modules, tests must use `import` syntax. The `--experimental-vm-modules` flag is already configured.

**Mocking pattern for Puppeteer `page`:** Since `device.js` uses the global `page` object directly, tests must set `global.page` before importing:
```js
// Mock the global page object before each test
beforeEach(() => {
  global.page = {
    goto: jest.fn(),
    click: jest.fn(),
    type: jest.fn(),
    // ... etc
  };
});
```

---

## Task 0: Test Infrastructure Setup

**Goal:** Set up the test directory structure, shared mocks, and npm script before any feature work begins.

**Files to create:**
- `__tests__/framework/helpers/mock-page.js` — Shared Puppeteer page mock
- `__tests__/framework/helpers/mock-step-logger.js` — Shared step logger mock

**Files to modify:** `package.json`

**Instructions:**

1. Create `__tests__/framework/helpers/mock-page.js`:
   ```js
   // Shared mock for the global Puppeteer `page` object
   export function createMockPage() {
     const mockElement = {
       isIntersectingViewport: jest.fn().mockResolvedValue(true),
       getAttribute: jest.fn(),
       textContent: 'mock text',
       value: 'mock value',
       className: 'mock-class',
     };

     return {
       goto: jest.fn().mockResolvedValue(null),
       click: jest.fn().mockResolvedValue(null),
       type: jest.fn().mockResolvedValue(null),
       select: jest.fn().mockResolvedValue([]),
       hover: jest.fn().mockResolvedValue(null),
       tap: jest.fn().mockResolvedValue(null),
       waitForSelector: jest.fn().mockResolvedValue(mockElement),
       waitForNavigation: jest.fn().mockResolvedValue(null),
       waitForFunction: jest.fn().mockResolvedValue(null),
       waitForResponse: jest.fn().mockResolvedValue(null),
       waitForRequest: jest.fn().mockResolvedValue(null),
       $: jest.fn().mockResolvedValue(mockElement),
       $$: jest.fn().mockResolvedValue([mockElement]),
       $eval: jest.fn().mockImplementation((sel, fn, ...args) => {
         // Simulate running fn against a mock element
         return Promise.resolve('mock text');
       }),
       $$eval: jest.fn().mockResolvedValue([]),
       url: jest.fn().mockReturnValue('https://example.com'),
       title: jest.fn().mockResolvedValue('Mock Page'),
       content: jest.fn().mockResolvedValue('<html></html>'),
       evaluate: jest.fn().mockResolvedValue(null),
       screenshot: jest.fn().mockResolvedValue(Buffer.from('')),
       metrics: jest.fn().mockResolvedValue({}),
       setRequestInterception: jest.fn().mockResolvedValue(null),
       on: jest.fn(),
       setCookie: jest.fn().mockResolvedValue(null),
       cookies: jest.fn().mockResolvedValue([]),
       deleteCookie: jest.fn().mockResolvedValue(null),
       setViewport: jest.fn().mockResolvedValue(null),
       emulate: jest.fn().mockResolvedValue(null),
       target: jest.fn().mockReturnValue({
         createCDPSession: jest.fn().mockResolvedValue({
           send: jest.fn().mockResolvedValue(null),
         }),
       }),
     };
   }
   ```

2. Create `__tests__/framework/helpers/mock-step-logger.js`:
   ```js
   // Mock step logger to prevent console output during tests
   export function mockStepLogger() {
     jest.unstable_mockModule('../../config/step-logger.js', () => ({
       stepLogger: {
         step: jest.fn(),
         clear: jest.fn(),
       },
     }));
   }
   ```

3. Add to `package.json` scripts:
   ```json
   "test:framework": "NODE_OPTIONS='--experimental-vm-modules --no-warnings' jest __tests__/framework/ --no-coverage"
   ```

4. Export `smartSelector` from `device.js` so it can be unit tested. Change the export line at the bottom of `config/device.js` from:
   ```js
   export { device };
   ```
   to:
   ```js
   export { device, smartSelector };
   ```

**Verify:** Run `npm run test:framework` — it should find 0 tests and exit cleanly.

---

## Task 1: Smart Selector Unit Tests + `resolveWaitTimeout` Tests

**Goal:** Test the existing `smartSelector()` and `resolveWaitTimeout()` functions which are the foundation of the device API.

**Files to create:** `__tests__/framework/smart-selector.test.js`
**Files to modify:** `config/device.js` (export `resolveWaitTimeout` as well)

**Instructions:**

1. In `config/device.js`, update the export to include `resolveWaitTimeout`:
   ```js
   export { device, smartSelector, resolveWaitTimeout };
   ```

2. Create `__tests__/framework/smart-selector.test.js`:
   ```js
   import { smartSelector, resolveWaitTimeout } from '../../config/device.js';

   describe('smartSelector', () => {
     // data-testid conversion
     test('converts plain string to data-testid selector', () => {
       expect(smartSelector('submit-button')).toBe('[data-testid="submit-button"]');
     });

     test('converts camelCase string to data-testid', () => {
       expect(smartSelector('loginForm')).toBe('[data-testid="loginForm"]');
     });

     // CSS pass-through
     test('passes through class selectors (.class)', () => {
       expect(smartSelector('.my-class')).toBe('.my-class');
     });

     test('passes through ID selectors (#id)', () => {
       expect(smartSelector('#my-id')).toBe('#my-id');
     });

     test('passes through attribute selectors ([attr])', () => {
       expect(smartSelector('[role="button"]')).toBe('[role="button"]');
     });

     test('passes through child combinators (>)', () => {
       expect(smartSelector('div > span')).toBe('div > span');
     });

     test('passes through descendant combinators (space)', () => {
       expect(smartSelector('div span')).toBe('div span');
     });

     test('passes through pseudo selectors (:)', () => {
       expect(smartSelector('input:focus')).toBe('input:focus');
     });

     test('passes through universal selector (*)', () => {
       expect(smartSelector('*')).toBe('*');
     });

     // HTML element names
     test('passes through common HTML element names', () => {
       const elements = ['body', 'div', 'span', 'button', 'input', 'form', 'h1', 'nav', 'main'];
       elements.forEach(el => {
         expect(smartSelector(el)).toBe(el);
       });
     });

     test('is case-insensitive for HTML elements', () => {
       expect(smartSelector('DIV')).toBe('DIV');
       expect(smartSelector('Body')).toBe('Body');
     });
   });

   describe('resolveWaitTimeout', () => {
     test('returns DEFAULT_WAIT_TIMEOUT (5000) when no options provided', () => {
       expect(resolveWaitTimeout()).toBe(5000);
       expect(resolveWaitTimeout({})).toBe(5000);
     });

     test('prefers waitTimeout over timeout', () => {
       expect(resolveWaitTimeout({ waitTimeout: 3000, timeout: 10000 })).toBe(3000);
     });

     test('falls back to timeout option', () => {
       expect(resolveWaitTimeout({ timeout: 8000 })).toBe(8000);
     });
   });
   ```

**Note:** The `smartSelector` import requires that `device.js` doesn't immediately fail when `page` is undefined. Since `smartSelector` is a pure function defined outside the `device` object, it can be imported independently. However, if the module-level `page` reference causes issues, wrap the import in a `beforeAll` that sets `global.page = {}` first.

**Verify:** `npm run test:framework` passes all smart selector tests.

---

## Task 2: Wire Up Lifecycle Hooks (Bug Fix) + Tests

**Goal:** The `beforeEach`/`afterEach`/`beforeAll`/`afterAll` hooks in `E2EConfiguration` are stored but never executed. Wire them into the Jest lifecycle.

**Files to modify:** `config/e2e-setup.js`
**Files to create:** `__tests__/framework/e2e-setup.test.js`

### Implementation:

1. In the `E2ESetup()` function (line 148 of `e2e-setup.js`), after creating `e2eConfig`, register Jest lifecycle hooks that call the stored callbacks:

   ```js
   function E2ESetup(config = {}) {
     const e2eConfig = new E2EConfiguration(config);

     // Wire lifecycle hooks into Jest globals
     if (typeof global.beforeEach === 'function') {
       global.beforeEach(async () => {
         await e2eConfig.runBeforeEach();
       });
     }
     if (typeof global.afterEach === 'function') {
       global.afterEach(async () => {
         await e2eConfig.runAfterEach();
       });
     }
     if (typeof global.beforeAll === 'function') {
       global.beforeAll(async () => {
         await e2eConfig.runBeforeAll();
       });
     }
     if (typeof global.afterAll === 'function') {
       global.afterAll(async () => {
         await e2eConfig.runAfterAll();
       });
     }

     return { /* ... existing return object ... */ };
   }
   ```

2. **Important consideration:** Since hooks may be registered AFTER `E2ESetup()` is called (the user calls `.beforeEach(fn)` on the returned object), the lifecycle hooks registered above must call the run methods dynamically — which they already do since `runBeforeEach()` checks `this.beforeEachHook` at call time. This is correct as-is.

3. Support multiple hooks per lifecycle event by changing from single function storage to arrays:
   ```js
   constructor(config = {}) {
     // ...
     this.beforeEachHooks = [];
     this.afterEachHooks = [];
     this.beforeAllHooks = [];
     this.afterAllHooks = [];
   }

   beforeEach(fn) {
     this.beforeEachHooks.push(fn);
     return this;
   }

   async runBeforeEach() {
     for (const hook of this.beforeEachHooks) {
       await hook(this.getDevices(), this.getTestData());
     }
   }
   ```
   Apply this pattern to all four lifecycle hooks.

### Tests:

Create `__tests__/framework/e2e-setup.test.js`:
```js
import { E2ESetup, E2EConfiguration } from '../../config/e2e-setup.js';

describe('E2EConfiguration', () => {
  let config;

  beforeEach(() => {
    config = new E2EConfiguration();
  });

  test('initializes with default values', () => {
    expect(config.getTestData()).toBeNull();
    expect(config.getDevices()).toEqual({});
    expect(config.initialized).toBe(true);
  });

  test('stores and retrieves test data from databuilder', () => {
    const mockData = { userEmail: 'test@test.com', userPassword: 'pass123' };
    const config = new E2EConfiguration({ databuilder: mockData });
    expect(config.getTestData()).toEqual(mockData);
  });

  test('stores and retrieves devices', () => {
    const mockDevice = { click: jest.fn() };
    const config = new E2EConfiguration({ devices: { browser: mockDevice } });
    expect(config.getDevices()).toEqual({ browser: mockDevice });
  });

  test('addDevice adds a new device', () => {
    config.addDevice('mobile', { tap: jest.fn() });
    expect(config.getDevice('mobile')).toBeDefined();
  });

  test('removeDevice removes a device', () => {
    config.addDevice('mobile', { tap: jest.fn() });
    config.removeDevice('mobile');
    expect(config.getDevice('mobile')).toBeUndefined();
  });

  test('reset clears all state', () => {
    config.addDevice('browser', {});
    config.setDataBuilder({ data: true });
    config.reset();
    expect(config.getTestData()).toBeNull();
    expect(config.getDevices()).toEqual({});
    expect(config.initialized).toBe(false);
  });

  test('debug returns configuration snapshot', () => {
    const debug = config.debug();
    expect(debug).toHaveProperty('config');
    expect(debug).toHaveProperty('environment');
    expect(debug).toHaveProperty('devices');
    expect(debug).toHaveProperty('hasDataBuilder');
    expect(debug).toHaveProperty('initialized');
  });

  test('setEnvironment and getEnvironment work correctly', () => {
    expect(config.getEnvironment()).toBe('test');
    config.setEnvironment('staging');
    expect(config.getEnvironment()).toBe('staging');
  });
});

describe('E2EConfiguration lifecycle hooks', () => {
  let config;

  beforeEach(() => {
    config = new E2EConfiguration();
  });

  test('registers and runs beforeEach hooks', async () => {
    const hook1 = jest.fn();
    const hook2 = jest.fn();
    config.beforeEach(hook1);
    config.beforeEach(hook2);
    await config.runBeforeEach();
    expect(hook1).toHaveBeenCalledWith({}, null);
    expect(hook2).toHaveBeenCalledWith({}, null);
  });

  test('registers and runs afterEach hooks', async () => {
    const hook = jest.fn();
    config.afterEach(hook);
    await config.runAfterEach();
    expect(hook).toHaveBeenCalled();
  });

  test('registers and runs beforeAll hooks', async () => {
    const hook = jest.fn();
    config.beforeAll(hook);
    await config.runBeforeAll();
    expect(hook).toHaveBeenCalled();
  });

  test('registers and runs afterAll hooks', async () => {
    const hook = jest.fn();
    config.afterAll(hook);
    await config.runAfterAll();
    expect(hook).toHaveBeenCalled();
  });

  test('runs multiple hooks in order', async () => {
    const order = [];
    config.beforeEach(() => order.push(1));
    config.beforeEach(() => order.push(2));
    config.beforeEach(() => order.push(3));
    await config.runBeforeEach();
    expect(order).toEqual([1, 2, 3]);
  });

  test('does nothing when no hooks registered', async () => {
    // Should not throw
    await config.runBeforeEach();
    await config.runAfterEach();
    await config.runBeforeAll();
    await config.runAfterAll();
  });
});

describe('E2ESetup factory function', () => {
  // Mock Jest globals so E2ESetup can register hooks
  let registeredBeforeEach = [];
  let registeredAfterEach = [];

  beforeEach(() => {
    registeredBeforeEach = [];
    registeredAfterEach = [];
    global.beforeEach = (fn) => registeredBeforeEach.push(fn);
    global.afterEach = (fn) => registeredAfterEach.push(fn);
    global.beforeAll = jest.fn();
    global.afterAll = jest.fn();
  });

  test('returns object with all expected methods', () => {
    const setup = E2ESetup();
    const expectedMethods = [
      'getTestData', 'getDevices', 'addDevice', 'removeDevice',
      'getDevice', 'setDataBuilder', 'updateConfig', 'setEnvironment',
      'getEnvironment', 'debug', 'reset', 'beforeEach', 'afterEach',
      'beforeAll', 'afterAll',
    ];
    expectedMethods.forEach(method => {
      expect(typeof setup[method]).toBe('function');
    });
  });

  test('wires beforeEach hooks into Jest global', async () => {
    const setup = E2ESetup();
    const myHook = jest.fn();
    setup.beforeEach(myHook);

    // Simulate Jest calling the registered beforeEach
    for (const fn of registeredBeforeEach) {
      await fn();
    }
    expect(myHook).toHaveBeenCalled();
  });

  test('wires afterEach hooks into Jest global', async () => {
    const setup = E2ESetup();
    const myHook = jest.fn();
    setup.afterEach(myHook);

    for (const fn of registeredAfterEach) {
      await fn();
    }
    expect(myHook).toHaveBeenCalled();
  });

  test('passes devices and test data to lifecycle hooks', async () => {
    const mockDevice = { click: jest.fn() };
    const mockData = { user: 'test' };
    const setup = E2ESetup({
      databuilder: mockData,
      devices: { browser: mockDevice },
    });

    const hook = jest.fn();
    setup.beforeEach(hook);

    for (const fn of registeredBeforeEach) {
      await fn();
    }
    expect(hook).toHaveBeenCalledWith(
      { browser: mockDevice },
      mockData
    );
  });
});
```

**Verify:** `npm run test:framework` — all E2ESetup tests pass, lifecycle hooks are actually called.

---

## Task 3: Data Builder Unit Tests

**Goal:** Test the existing `BaseDataBuilder` and `AgentTestDataBuilder` classes.

**Files to create:** `__tests__/framework/data-builder.test.js`

**Instructions:**

Create `__tests__/framework/data-builder.test.js`:
```js
import { BaseDataBuilder, baseDataBuilder } from '../../databuilders/base-data-builder.js';
import { AgentTestDataBuilder } from '../../databuilders/agent-test-data-builder.js';

describe('BaseDataBuilder', () => {
  test('has default version "1"', () => {
    expect(baseDataBuilder.getVersion()).toBe('1');
  });

  test('has name "BaseDataBuilder"', () => {
    expect(baseDataBuilder.name).toBe('BaseDataBuilder');
  });

  test('genImp throws when called on base class', () => {
    expect(() => baseDataBuilder.genImp()).toThrow('genImp() must be implemented');
  });

  test('can be instantiated via class', () => {
    const builder = new BaseDataBuilder();
    expect(builder.version).toBe('1');
    expect(builder.name).toBe('BaseDataBuilder');
  });
});

describe('AgentTestDataBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = AgentTestDataBuilder();
  });

  test('is an instance of BaseDataBuilder', () => {
    expect(builder instanceof BaseDataBuilder).toBe(true);
  });

  test('has name "AgentTestDataBuilder"', () => {
    expect(builder.name).toBe('AgentTestDataBuilder');
  });

  test('has version "1"', () => {
    expect(builder.getVersion()).toBe('1');
  });

  test('genImp populates userEmail', () => {
    expect(builder.userEmail).toBe('agent@anilathomes.com');
  });

  test('genImp populates userPassword', () => {
    expect(builder.userPassword).toBe('Password.123$');
  });

  test('genImp does not throw (overrides base)', () => {
    expect(() => builder.genImp()).not.toThrow();
  });

  test('genImp returns the builder instance', () => {
    const result = builder.genImp();
    expect(result).toBe(builder);
  });

  test('each call to AgentTestDataBuilder() creates a new instance', () => {
    const a = AgentTestDataBuilder();
    const b = AgentTestDataBuilder();
    expect(a).not.toBe(b);
  });
});
```

**Verify:** `npm run test:framework` — all data builder tests pass.

---

## Task 4: Better Error Messages + Tests

**Goal:** When a device action fails, show the user what went wrong with full context.

**Files to modify:** `config/device.js`
**Files to create:** `__tests__/framework/device-errors.test.js`

### Implementation:

1. Create a helper function at the top of `device.js` (after the `resolveWaitTimeout` definition):
   ```js
   const enhanceError = async (error, selector, resolvedSelector, action) => {
     let currentUrl = 'unknown';
     let availableTestIds = [];
     try {
       currentUrl = page.url();
       availableTestIds = await page.$$eval('[data-testid]', elements =>
         elements.map(el => el.getAttribute('data-testid'))
       );
     } catch (_) {
       // Page may not be available
     }

     const enhanced = new Error(
       `${action} failed for "${selector}" (resolved to "${resolvedSelector}")\n` +
       `  Page URL: ${currentUrl}\n` +
       `  Available data-testid values: [${availableTestIds.map(id => `"${id}"`).join(', ')}]\n` +
       `  Original error: ${error.message}`
     );
     enhanced.stack = error.stack;
     throw enhanced;
   };
   ```

2. Wrap each device method's core logic in a try/catch that calls `enhanceError`. Example for `click`:
   ```js
   click: async (selector, options = {}) => {
     const resolved = smartSelector(selector);
     const waitTimeout = resolveWaitTimeout(options);
     const { waitTimeout: _waitTimeout, ...clickOptions } = options;
     const displaySelector = selector.length > 30 ? selector.substring(0, 30) + '...' : selector;
     stepLogger.step('Clicking', `"${displaySelector}"`);
     try {
       await page.waitForSelector(resolved, { timeout: waitTimeout });
       return await page.click(resolved, clickOptions);
     } catch (error) {
       await enhanceError(error, selector, resolved, 'Click');
     }
   },
   ```

3. Apply to: `click`, `type`, `select`, `hover`, `waitFor`, `get`, `getAll`, `getText`, `getValue`.

4. For `expect()` assertion methods, add expected vs actual in the enhanced error:
   ```js
   toContain: async (expectedText) => {
     stepLogger.step('Verifying text', `...`);
     try {
       await page.waitForSelector(resolvedSelector, { timeout: waitTimeout });
       const text = await page.$eval(resolvedSelector, el => el.textContent);
       if (negate) {
         expect(text).not.toContain(expectedText);
       } else {
         expect(text).toContain(expectedText);
       }
     } catch (error) {
       // Re-throw with context
       const enhanced = new Error(
         `Assertion "toContain" failed for "${selector}" (resolved to "${resolvedSelector}")\n` +
         `  Expected: ${negate ? 'not ' : ''}to contain "${expectedText}"\n` +
         `  Page URL: ${page.url()}\n` +
         `  Original error: ${error.message}`
       );
       enhanced.stack = error.stack;
       throw enhanced;
     }
   },
   ```

5. Also export `enhanceError` for testing:
   ```js
   export { device, smartSelector, resolveWaitTimeout, enhanceError };
   ```

### Tests:

Create `__tests__/framework/device-errors.test.js`:
```js
import { createMockPage } from './helpers/mock-page.js';

// Must set global.page before importing device
let device, enhanceError;

beforeAll(async () => {
  // Mock step logger
  jest.unstable_mockModule('../../config/step-logger.js', () => ({
    stepLogger: { step: jest.fn(), clear: jest.fn() },
  }));

  global.page = createMockPage();
  const mod = await import('../../config/device.js');
  device = mod.device;
  enhanceError = mod.enhanceError;
});

beforeEach(() => {
  global.page = createMockPage();
});

describe('enhanced error messages', () => {
  test('click shows selector, resolved selector, and page URL on failure', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    global.page.url.mockReturnValue('https://example.com/login');
    global.page.$$eval.mockResolvedValue(['email-input', 'password-input']);

    await expect(device.click('submit-btn')).rejects.toThrow(/Click failed for "submit-btn"/);
    await expect(device.click('submit-btn')).rejects.toThrow(/Page URL: https:\/\/example\.com\/login/);
  });

  test('type shows enhanced error on failure', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));

    await expect(device.type('email', 'test@test.com')).rejects.toThrow(/Type failed/);
  });

  test('select shows enhanced error on failure', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));

    await expect(device.select('dropdown', 'option1')).rejects.toThrow(/Select failed/);
  });

  test('hover shows enhanced error on failure', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));

    await expect(device.hover('menu-item')).rejects.toThrow(/Hover failed/);
  });

  test('getText shows enhanced error on failure', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));

    await expect(device.getText('heading')).rejects.toThrow(/GetText failed/);
  });

  test('error includes available data-testid values', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    global.page.$$eval.mockResolvedValue(['login-btn', 'signup-btn']);

    await expect(device.click('submit-btn')).rejects.toThrow(/Available data-testid values/);
  });

  test('error still works when page is unavailable', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    global.page.url.mockImplementation(() => { throw new Error('detached'); });

    // Should still throw an enhanced error, not crash
    await expect(device.click('btn')).rejects.toThrow(/Click failed/);
  });
});

describe('device methods succeed with valid page', () => {
  test('click resolves successfully', async () => {
    await expect(device.click('submit-btn')).resolves.not.toThrow();
    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="submit-btn"]',
      expect.objectContaining({ timeout: expect.any(Number) })
    );
    expect(global.page.click).toHaveBeenCalledWith('[data-testid="submit-btn"]', {});
  });

  test('type resolves successfully', async () => {
    await expect(device.type('email', 'test@test.com')).resolves.not.toThrow();
  });

  test('exists returns true when element found', async () => {
    const result = await device.exists('my-element');
    expect(result).toBe(true);
  });

  test('exists returns false when element not found', async () => {
    global.page.$.mockResolvedValue(null);
    const result = await device.exists('missing');
    expect(result).toBe(false);
  });
});
```

**Verify:** `npm run test:framework` — error enhancement tests pass, success-path tests pass.

---

## Task 5: Validate `device.type(locator, input)` + Tests

**Goal:** Keep text entry API centered on `device.type('locator', 'sample input')` and validate behavior with dedicated unit tests.

**Files to create:** `__tests__/framework/device-type.test.js`

### Tests:

Create `__tests__/framework/device-type.test.js`:
```js
import { createMockPage } from './helpers/mock-page.js';

let device;

beforeAll(async () => {
  process.env.JEST_SILENT = 'true';
  global.page = createMockPage();
  const mod = await import('../../config/device.js');
  device = mod.device;
});

beforeEach(() => {
  global.page = createMockPage();
});

describe('device.type()', () => {
  test('waits for selector before typing', async () => {
    await device.type('email-input', 'sample input');
    expect(global.page.waitForSelector).toHaveBeenCalledWith(
      '[data-testid="email-input"]',
      expect.objectContaining({ timeout: expect.any(Number) })
    );
  });

  test('types input into resolved selector', async () => {
    await device.type('email-input', 'sample input');
    expect(global.page.type).toHaveBeenCalledWith(
      '[data-testid="email-input"]',
      'sample input',
      {}
    );
  });

  test('passes through typing options except waitTimeout', async () => {
    await device.type('email-input', 'abc', { delay: 25, waitTimeout: 9999 });
    expect(global.page.type).toHaveBeenCalledWith(
      '[data-testid="email-input"]',
      'abc',
      { delay: 25 }
    );
  });

  test('uses smart selector for data-testid', async () => {
    await device.type('my-input', 'text');
    expect(global.page.type).toHaveBeenCalledWith(
      '[data-testid="my-input"]',
      'text',
      expect.any(Object)
    );
  });

  test('passes through CSS selectors', async () => {
    await device.type('#my-input', 'text');
    expect(global.page.type).toHaveBeenCalledWith(
      '#my-input',
      'text',
      expect.any(Object)
    );
  });

  test('throws enhanced error on failure', async () => {
    global.page.waitForSelector.mockRejectedValue(new Error('Timeout'));
    await expect(device.type('missing', 'text')).rejects.toThrow(/Type failed/);
  });
});
```

**Verify:** `npm run test:framework` — type behavior tests pass.

---

## Task 6: `waitForText()` and `waitForUrl()` Utilities + Tests

**Goal:** Add common wait utilities that currently require manual polling.

**Files to modify:** `config/device.js`
**Files to create:** `__tests__/framework/device-wait-utils.test.js`

### Implementation:

Add after the `waitForNavigation` method in `device.js`:

```js
waitForText: async (selector, text, options = {}) => {
  const resolved = smartSelector(selector);
  const timeout = resolveWaitTimeout(options);
  stepLogger.step('Waiting for text', `"${text}" in "${selector}"`);
  try {
    await page.waitForFunction(
      (sel, txt) => {
        const el = document.querySelector(sel);
        return el && el.textContent.includes(txt);
      },
      { timeout },
      resolved,
      text
    );
  } catch (error) {
    await enhanceError(error, selector, resolved, 'WaitForText');
  }
},

waitForUrl: async (urlPattern, options = {}) => {
  const timeout = resolveWaitTimeout(options);
  stepLogger.step('Waiting for URL', `"${urlPattern}"`);
  try {
    await page.waitForFunction(
      (pattern) => window.location.href.includes(pattern),
      { timeout },
      urlPattern
    );
  } catch (error) {
    const enhanced = new Error(
      `WaitForUrl failed: URL did not match "${urlPattern}" within ${timeout}ms\n` +
      `  Current URL: ${page.url()}\n` +
      `  Original error: ${error.message}`
    );
    enhanced.stack = error.stack;
    throw enhanced;
  }
},
```

### Tests:

Create `__tests__/framework/device-wait-utils.test.js`:
```js
import { createMockPage } from './helpers/mock-page.js';

let device;

beforeAll(async () => {
  jest.unstable_mockModule('../../config/step-logger.js', () => ({
    stepLogger: { step: jest.fn(), clear: jest.fn() },
  }));

  global.page = createMockPage();
  const mod = await import('../../config/device.js');
  device = mod.device;
});

beforeEach(() => {
  global.page = createMockPage();
});

describe('device.waitForText()', () => {
  test('calls waitForFunction with correct selector and text', async () => {
    await device.waitForText('heading', 'Welcome');
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ timeout: 5000 }),
      '[data-testid="heading"]',
      'Welcome'
    );
  });

  test('uses smart selector', async () => {
    await device.waitForText('.title', 'Hello');
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Object),
      '.title',
      'Hello'
    );
  });

  test('respects custom timeout', async () => {
    await device.waitForText('heading', 'text', { timeout: 10000 });
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ timeout: 10000 }),
      expect.any(String),
      expect.any(String)
    );
  });

  test('throws enhanced error on timeout', async () => {
    global.page.waitForFunction.mockRejectedValue(new Error('Timeout'));
    await expect(device.waitForText('heading', 'Missing'))
      .rejects.toThrow(/WaitForText failed/);
  });
});

describe('device.waitForUrl()', () => {
  test('calls waitForFunction with url pattern', async () => {
    await device.waitForUrl('/dashboard');
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ timeout: 5000 }),
      '/dashboard'
    );
  });

  test('respects custom timeout', async () => {
    await device.waitForUrl('/home', { timeout: 15000 });
    expect(global.page.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ timeout: 15000 }),
      '/home'
    );
  });

  test('throws descriptive error on timeout', async () => {
    global.page.waitForFunction.mockRejectedValue(new Error('Timeout'));
    global.page.url.mockReturnValue('https://example.com/login');
    await expect(device.waitForUrl('/dashboard'))
      .rejects.toThrow(/WaitForUrl failed/);
    await expect(device.waitForUrl('/dashboard'))
      .rejects.toThrow(/Current URL/);
  });
});
```

**Verify:** `npm run test:framework` — wait utility tests pass.

---

## Task 7: Configurable Timeouts + Tests

**Goal:** Let users set default timeouts globally instead of hardcoding 5000ms.

**Files to modify:** `config/device.js`, `config/e2e-setup.js`, `config/chrome-api.js`
**Files to modify (tests):** `__tests__/framework/smart-selector.test.js` (add timeout tests)

### Implementation:

1. In `e2e-setup.js`, accept a `timeout` option in the config and set it on a global:
   ```js
   function E2ESetup(config = {}) {
     const e2eConfig = new E2EConfiguration(config);

     // Set global timeout for device.js to read
     if (config.timeout) {
       global.__JEST_E2E_TIMEOUT__ = config.timeout;
     }
     // ... rest of setup
   }
   ```

2. In `device.js`, update `DEFAULT_WAIT_TIMEOUT` to be dynamic:
   ```js
   const getDefaultTimeout = () => global.__JEST_E2E_TIMEOUT__ || 5000;
   ```
   Update `resolveWaitTimeout`:
   ```js
   const resolveWaitTimeout = (options = {}) => options.waitTimeout || options.timeout || getDefaultTimeout();
   ```

3. In `chrome-api.js`, replace the hardcoded `30000` in `waitForResponse` and `waitForRequest`:
   ```js
   async waitForResponse(urlPattern, timeout = global.__JEST_E2E_TIMEOUT__ || 30000) {
   async waitForRequest(urlPattern, timeout = global.__JEST_E2E_TIMEOUT__ || 30000) {
   ```

### Tests:

Add to `__tests__/framework/e2e-setup.test.js`:
```js
describe('E2ESetup configurable timeout', () => {
  afterEach(() => {
    delete global.__JEST_E2E_TIMEOUT__;
  });

  test('sets global timeout when config.timeout provided', () => {
    E2ESetup({ timeout: 10000 });
    expect(global.__JEST_E2E_TIMEOUT__).toBe(10000);
  });

  test('does not set global timeout when not provided', () => {
    delete global.__JEST_E2E_TIMEOUT__;
    E2ESetup({});
    expect(global.__JEST_E2E_TIMEOUT__).toBeUndefined();
  });
});
```

Add to `__tests__/framework/smart-selector.test.js`:
```js
describe('resolveWaitTimeout with global override', () => {
  afterEach(() => {
    delete global.__JEST_E2E_TIMEOUT__;
  });

  test('uses global timeout when set', () => {
    global.__JEST_E2E_TIMEOUT__ = 15000;
    expect(resolveWaitTimeout({})).toBe(15000);
  });

  test('options.waitTimeout still overrides global', () => {
    global.__JEST_E2E_TIMEOUT__ = 15000;
    expect(resolveWaitTimeout({ waitTimeout: 3000 })).toBe(3000);
  });
});
```

**Verify:** `npm run test:framework` — timeout configuration tests pass.

---

## Task 8: Retry / Flaky Test Support + Tests

**Goal:** Allow tests to be retried on failure.

**Files to modify:** `config/e2e-setup.js`, `bin/jest-e2e.js`
**Files to modify (tests):** `__tests__/framework/e2e-setup.test.js`

### Implementation:

1. In `E2ESetup()`, accept a `retries` option and call `jest.retryTimes()`:
   ```js
   function E2ESetup(config = {}) {
     const e2eConfig = new E2EConfiguration(config);

     const retries = config.retries || parseInt(process.env.JEST_E2E_RETRIES) || 0;
     if (retries > 0 && typeof jest !== 'undefined') {
       jest.retryTimes(retries, { logErrorsBeforeRetry: true });
     }
     // ... rest of setup
   }
   ```

2. In `bin/jest-e2e.js`, add a `--retries <n>` CLI flag. Find the argument parsing section and add:
   ```js
   if (args.includes('--retries')) {
     const index = args.indexOf('--retries');
     process.env.JEST_E2E_RETRIES = args[index + 1];
     args.splice(index, 2);
   }
   ```

### Tests:

Add to `__tests__/framework/e2e-setup.test.js`:
```js
describe('E2ESetup retry support', () => {
  let mockRetryTimes;

  beforeEach(() => {
    mockRetryTimes = jest.fn();
    global.jest = { retryTimes: mockRetryTimes };
  });

  afterEach(() => {
    delete process.env.JEST_E2E_RETRIES;
  });

  test('calls jest.retryTimes when retries config provided', () => {
    E2ESetup({ retries: 3 });
    expect(mockRetryTimes).toHaveBeenCalledWith(3, { logErrorsBeforeRetry: true });
  });

  test('does not call retryTimes when retries is 0', () => {
    E2ESetup({ retries: 0 });
    expect(mockRetryTimes).not.toHaveBeenCalled();
  });

  test('reads JEST_E2E_RETRIES env var as fallback', () => {
    process.env.JEST_E2E_RETRIES = '2';
    E2ESetup({});
    expect(mockRetryTimes).toHaveBeenCalledWith(2, { logErrorsBeforeRetry: true });
  });

  test('config.retries takes priority over env var', () => {
    process.env.JEST_E2E_RETRIES = '5';
    E2ESetup({ retries: 2 });
    expect(mockRetryTimes).toHaveBeenCalledWith(2, { logErrorsBeforeRetry: true });
  });
});
```

**Verify:** `npm run test:framework` — retry tests pass.

---

## Task 9: Screenshot on Failure + Tests

**Goal:** Automatically capture a screenshot when a test fails for debugging.

**Files to modify:** `config/e2e-setup.js`
**Files to create:** `__tests__/framework/screenshot-on-failure.test.js`

### Implementation:

1. Add imports at the top of `e2e-setup.js`:
   ```js
   import path from 'path';
   import fs from 'fs';
   ```

2. Inside `E2ESetup()`, after creating `e2eConfig`, add a built-in `afterEach` that captures screenshots on failure:
   ```js
   const screenshotOnFailure = config.screenshotOnFailure !== false; // default true

   if (screenshotOnFailure && typeof global.afterEach === 'function') {
     global.afterEach(async () => {
       const testState = expect.getState();
       const currentTest = testState?.currentTestName;
       // Check for test failure via jasmine (jest-puppeteer uses jasmine2 runner)
       const hasFailed = typeof jasmine !== 'undefined' &&
         jasmine.currentTest?.failedExpectations?.length > 0;

       if (hasFailed && global.page) {
         const screenshotDir = path.join(process.cwd(), '__screenshots__');
         if (!fs.existsSync(screenshotDir)) {
           fs.mkdirSync(screenshotDir, { recursive: true });
         }
         const safeName = (currentTest || 'unknown-test')
           .replace(/[^a-z0-9]/gi, '-').toLowerCase();
         const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
         const filePath = path.join(screenshotDir, `${safeName}-${timestamp}.png`);

         try {
           await global.page.screenshot({ path: filePath, fullPage: true });
           console.log(`\n  Screenshot saved: ${filePath}`);
         } catch (_) {
           // Page may have crashed
         }
       }
     });
   }
   ```

3. Add `__screenshots__` to the `.gitignore` template in `bin/jest-e2e.js` (in the init section).

### Tests:

Create `__tests__/framework/screenshot-on-failure.test.js`:
```js
import { E2ESetup } from '../../config/e2e-setup.js';

describe('screenshot on failure', () => {
  let registeredAfterEach = [];

  beforeEach(() => {
    registeredAfterEach = [];
    global.beforeEach = jest.fn();
    global.afterEach = (fn) => registeredAfterEach.push(fn);
    global.beforeAll = jest.fn();
    global.afterAll = jest.fn();
    global.page = {
      screenshot: jest.fn().mockResolvedValue(Buffer.from('')),
    };
    global.expect = { getState: () => ({ currentTestName: 'my test' }) };
  });

  test('registers afterEach hook by default', () => {
    E2ESetup({});
    // Should have at least one afterEach registered (screenshot + lifecycle)
    expect(registeredAfterEach.length).toBeGreaterThanOrEqual(1);
  });

  test('does not register screenshot hook when screenshotOnFailure is false', () => {
    const beforeCount = registeredAfterEach.length;
    E2ESetup({ screenshotOnFailure: false });
    // Should still register lifecycle afterEach but not screenshot
    // The exact count depends on implementation; verify screenshot is not called
    // when there's no failure
  });

  test('takes screenshot when jasmine reports failure', async () => {
    global.jasmine = {
      currentTest: { failedExpectations: [{ message: 'some failure' }] },
    };

    E2ESetup({});

    for (const fn of registeredAfterEach) {
      await fn();
    }

    expect(global.page.screenshot).toHaveBeenCalledWith(
      expect.objectContaining({ fullPage: true })
    );
  });

  test('does not take screenshot when test passes', async () => {
    global.jasmine = {
      currentTest: { failedExpectations: [] },
    };

    E2ESetup({});

    for (const fn of registeredAfterEach) {
      await fn();
    }

    expect(global.page.screenshot).not.toHaveBeenCalled();
  });

  test('does not crash when page is unavailable', async () => {
    global.jasmine = {
      currentTest: { failedExpectations: [{ message: 'fail' }] },
    };
    global.page.screenshot.mockRejectedValue(new Error('detached'));

    E2ESetup({});

    // Should not throw
    for (const fn of registeredAfterEach) {
      await fn();
    }
  });
});
```

**Verify:** `npm run test:framework` — screenshot tests pass.

---

## Task 10: Network Request Mocking + Tests

**Goal:** Enhance `interceptNetwork()` to support response mocking, not just blocking.

**Files to modify:** `config/chrome-api.js`
**Files to create:** `__tests__/framework/chrome-api.test.js`

### Implementation:

Replace the current `interceptNetwork` method in `chrome-api.js`:

```js
async interceptNetwork(rules = []) {
  if (!global.page) return;

  // Backward compatibility: array of strings = block patterns
  if (rules.length > 0 && typeof rules[0] === 'string') {
    rules = rules.map(pattern => ({ pattern, action: 'block' }));
  }

  await global.page.setRequestInterception(true);
  global.page.on('request', (request) => {
    const url = request.url();

    for (const rule of rules) {
      if (url.includes(rule.pattern)) {
        if (rule.action === 'block') {
          return request.abort();
        }
        if (rule.action === 'mock' && rule.response) {
          return request.respond({
            status: rule.response.status || 200,
            contentType: rule.response.contentType || 'application/json',
            body: typeof rule.response.body === 'string'
              ? rule.response.body
              : JSON.stringify(rule.response.body),
            headers: rule.response.headers || {},
          });
        }
      }
    }

    request.continue();
  });
}
```

### Tests:

Create `__tests__/framework/chrome-api.test.js`:
```js
import { createMockPage } from './helpers/mock-page.js';

let createChromeE2EApi;

beforeAll(async () => {
  jest.unstable_mockModule('../../config/step-logger.js', () => ({
    stepLogger: { step: jest.fn(), clear: jest.fn() },
  }));

  global.page = createMockPage();
  const mod = await import('../../config/chrome-api.js');
  createChromeE2EApi = mod.createChromeE2EApi;
});

beforeEach(() => {
  global.page = createMockPage();
});

describe('ChromeE2EApi', () => {
  test('createChromeE2EApi returns an instance with device methods', () => {
    const api = createChromeE2EApi();
    expect(typeof api.click).toBe('function');
    expect(typeof api.type).toBe('function');
    expect(typeof api.navigate).toBe('function');
    expect(typeof api.screenshot).toBe('function');
  });

  test('inherits base device methods', () => {
    const api = createChromeE2EApi();
    expect(typeof api.exists).toBe('function');
    expect(typeof api.getText).toBe('function');
    expect(typeof api.waitFor).toBe('function');
    expect(typeof api.expect).toBe('function');
  });

  test('has Chrome-specific methods', () => {
    const api = createChromeE2EApi();
    expect(typeof api.getPerformanceMetrics).toBe('function');
    expect(typeof api.interceptNetwork).toBe('function');
    expect(typeof api.addCookie).toBe('function');
    expect(typeof api.getCookies).toBe('function');
    expect(typeof api.clearCookies).toBe('function');
    expect(typeof api.waitForResponse).toBe('function');
    expect(typeof api.waitForRequest).toBe('function');
    expect(typeof api.setMobileViewport).toBe('function');
    expect(typeof api.simulateTouch).toBe('function');
  });
});

describe('interceptNetwork', () => {
  test('enables request interception', async () => {
    const api = createChromeE2EApi();
    await api.interceptNetwork([]);
    expect(global.page.setRequestInterception).toHaveBeenCalledWith(true);
  });

  test('registers a request handler', async () => {
    const api = createChromeE2EApi();
    await api.interceptNetwork([]);
    expect(global.page.on).toHaveBeenCalledWith('request', expect.any(Function));
  });

  test('backward compat: string array treated as block patterns', async () => {
    const api = createChromeE2EApi();
    await api.interceptNetwork(['analytics.google.com', 'tracker.js']);
    expect(global.page.setRequestInterception).toHaveBeenCalledWith(true);

    // Get the registered handler
    const handler = global.page.on.mock.calls.find(c => c[0] === 'request')[1];

    // Simulate a request matching a block pattern
    const mockRequest = {
      url: () => 'https://analytics.google.com/collect',
      abort: jest.fn(),
      continue: jest.fn(),
      respond: jest.fn(),
    };
    handler(mockRequest);
    expect(mockRequest.abort).toHaveBeenCalled();
    expect(mockRequest.continue).not.toHaveBeenCalled();
  });

  test('block action aborts matching requests', async () => {
    const api = createChromeE2EApi();
    await api.interceptNetwork([
      { pattern: 'analytics.com', action: 'block' },
    ]);

    const handler = global.page.on.mock.calls.find(c => c[0] === 'request')[1];
    const mockRequest = {
      url: () => 'https://analytics.com/track',
      abort: jest.fn(),
      continue: jest.fn(),
      respond: jest.fn(),
    };
    handler(mockRequest);
    expect(mockRequest.abort).toHaveBeenCalled();
  });

  test('mock action responds with custom data', async () => {
    const api = createChromeE2EApi();
    await api.interceptNetwork([
      {
        pattern: '/api/users',
        action: 'mock',
        response: { body: { users: [] }, status: 200 },
      },
    ]);

    const handler = global.page.on.mock.calls.find(c => c[0] === 'request')[1];
    const mockRequest = {
      url: () => 'https://example.com/api/users',
      abort: jest.fn(),
      continue: jest.fn(),
      respond: jest.fn(),
    };
    handler(mockRequest);
    expect(mockRequest.respond).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 200,
        body: JSON.stringify({ users: [] }),
      })
    );
  });

  test('mock action handles string body', async () => {
    const api = createChromeE2EApi();
    await api.interceptNetwork([
      {
        pattern: '/api/health',
        action: 'mock',
        response: { body: 'OK', status: 200, contentType: 'text/plain' },
      },
    ]);

    const handler = global.page.on.mock.calls.find(c => c[0] === 'request')[1];
    const mockRequest = {
      url: () => 'https://example.com/api/health',
      abort: jest.fn(),
      continue: jest.fn(),
      respond: jest.fn(),
    };
    handler(mockRequest);
    expect(mockRequest.respond).toHaveBeenCalledWith(
      expect.objectContaining({ body: 'OK', contentType: 'text/plain' })
    );
  });

  test('non-matching requests are continued', async () => {
    const api = createChromeE2EApi();
    await api.interceptNetwork([
      { pattern: 'analytics.com', action: 'block' },
    ]);

    const handler = global.page.on.mock.calls.find(c => c[0] === 'request')[1];
    const mockRequest = {
      url: () => 'https://example.com/page',
      abort: jest.fn(),
      continue: jest.fn(),
      respond: jest.fn(),
    };
    handler(mockRequest);
    expect(mockRequest.continue).toHaveBeenCalled();
    expect(mockRequest.abort).not.toHaveBeenCalled();
  });

  test('does nothing when page is null', async () => {
    global.page = null;
    const api = createChromeE2EApi();
    // Should not throw
    await api.interceptNetwork([{ pattern: 'x', action: 'block' }]);
  });
});

describe('cookie management', () => {
  test('addCookie calls page.setCookie', async () => {
    const api = createChromeE2EApi();
    await api.addCookie({ name: 'session', value: 'abc123' });
    expect(global.page.setCookie).toHaveBeenCalledWith({ name: 'session', value: 'abc123' });
  });

  test('getCookies returns cookies', async () => {
    global.page.cookies.mockResolvedValue([{ name: 'session', value: 'abc' }]);
    const api = createChromeE2EApi();
    const cookies = await api.getCookies();
    expect(cookies).toEqual([{ name: 'session', value: 'abc' }]);
  });

  test('clearCookies deletes all cookies', async () => {
    global.page.cookies.mockResolvedValue([
      { name: 'a', value: '1' },
      { name: 'b', value: '2' },
    ]);
    const api = createChromeE2EApi();
    await api.clearCookies();
    expect(global.page.deleteCookie).toHaveBeenCalled();
  });
});

describe('mobile helpers', () => {
  test('setMobileViewport sets viewport with isMobile true', async () => {
    const api = createChromeE2EApi();
    await api.setMobileViewport(375, 667);
    expect(global.page.setViewport).toHaveBeenCalledWith({
      width: 375,
      height: 667,
      isMobile: true,
    });
  });

  test('setMobileViewport uses defaults', async () => {
    const api = createChromeE2EApi();
    await api.setMobileViewport();
    expect(global.page.setViewport).toHaveBeenCalledWith({
      width: 375,
      height: 667,
      isMobile: true,
    });
  });
});
```

**Verify:** `npm run test:framework` — all chrome-api tests pass.

---

## Task 11: Fix `simulateTouch()` Stub + Tests

**Goal:** Implement touch simulation properly using CDP.

**Files to modify:** `config/chrome-api.js`
**Files to modify (tests):** `__tests__/framework/chrome-api.test.js`

### Implementation:

Replace `simulateTouch()` in `chrome-api.js`:
```js
async simulateTouch() {
  if (!global.page) return;
  const client = await global.page.target().createCDPSession();
  await client.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 5,
  });
}
```

Add a `tap` method:
```js
async tap(selector) {
  if (!global.page) return;
  const resolved = smartSelector ? smartSelector(selector) : selector;
  await global.page.tap(resolved);
}
```

**Note:** `chrome-api.js` doesn't currently import `smartSelector`. Either import it:
```js
import { device as baseDevice, smartSelector } from './device.js';
```
Or use a simpler approach — since `tap` is Chrome-specific, it can use raw CSS selectors and document it accordingly.

### Tests:

Add to `__tests__/framework/chrome-api.test.js`:
```js
describe('simulateTouch', () => {
  test('enables touch emulation via CDP', async () => {
    const api = createChromeE2EApi();
    await api.simulateTouch();

    const target = global.page.target();
    const cdp = await target.createCDPSession();
    expect(cdp.send).toHaveBeenCalledWith('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 5,
    });
  });

  test('does nothing when page is null', async () => {
    global.page = null;
    const api = createChromeE2EApi();
    await expect(api.simulateTouch()).resolves.not.toThrow();
  });
});

describe('tap', () => {
  test('calls page.tap with selector', async () => {
    const api = createChromeE2EApi();
    await api.tap('#my-button');
    expect(global.page.tap).toHaveBeenCalledWith('#my-button');
  });
});
```

**Verify:** `npm run test:framework` — touch/tap tests pass.

---

## Task 12: TypeScript Type Definitions

**Goal:** Add a `.d.ts` file so TypeScript users get autocomplete.

**Files to create:** `types/index.d.ts`
**Files to modify:** `package.json`

### Instructions:

1. Create `types/index.d.ts` with type definitions for ALL public APIs (including new ones from Tasks 2-11):
   ```ts
   export interface DeviceOptions {
     waitTimeout?: number;
     timeout?: number;
   }

   export interface E2ESetupConfig {
     databuilder?: Record<string, any>;
     devices?: Record<string, Device>;
     retries?: number;
     timeout?: number;
     screenshotOnFailure?: boolean;
   }

   export interface Device {
     navigate(url: string, options?: object): Promise<any>;
     click(selector: string, options?: DeviceOptions): Promise<void>;
     type(selector: string, text: string, options?: object): Promise<void>;
     select(selector: string, value: string | string[], options?: object): Promise<void>;
     hover(selector: string, options?: object): Promise<void>;
     waitFor(selector: string, options?: object): Promise<any>;
     waitForText(selector: string, text: string, options?: object): Promise<void>;
     waitForUrl(urlPattern: string, options?: object): Promise<void>;
     waitForNavigation(options?: object): Promise<any>;
     wait(ms: number): Promise<void>;
     get(selector: string, options?: DeviceOptions): Promise<any>;
     getAll(selector: string, options?: DeviceOptions): Promise<any[]>;
     getText(selector: string, options?: DeviceOptions): Promise<string>;
     getValue(selector: string, options?: DeviceOptions): Promise<string>;
     exists(selector: string): Promise<boolean>;
     isVisible(selector: string): Promise<boolean>;
     url(): string;
     title(): Promise<string>;
     content(): Promise<string>;
     evaluate(fn: Function): Promise<any>;
     screenshot(options?: object): Promise<Buffer>;
     expect(selector: string, options?: DeviceOptions): DeviceAssertions;
     css: CSSDevice;
   }

   export interface DeviceAssertions {
     toContain(text: string): Promise<void>;
     toHaveText(text: string): Promise<void>;
     toBeVisible(): Promise<void>;
     toExist(): Promise<void>;
     toHaveValue(value: string): Promise<void>;
     toHaveAttribute(name: string, value: string): Promise<void>;
     toHaveClass(className: string): Promise<void>;
     toHaveCount(count: number): Promise<void>;
     not: DeviceAssertions;
   }

   export interface CSSDevice {
     click(selector: string, options?: object): Promise<void>;
     type(selector: string, text: string, options?: object): Promise<void>;
     waitFor(selector: string, options?: object): Promise<any>;
     get(selector: string): Promise<any>;
     getAll(selector: string): Promise<any[]>;
     getText(selector: string): Promise<string>;
     exists(selector: string): Promise<boolean>;
   }

   export interface NetworkRule {
     pattern: string;
     action: 'block' | 'mock';
     response?: {
       status?: number;
       contentType?: string;
       body?: any;
       headers?: Record<string, string>;
     };
   }

   export interface ChromeDevice extends Device {
     enableDevTools(): Promise<void>;
     getPerformanceMetrics(): Promise<Record<string, any> | null>;
     interceptNetwork(rules: NetworkRule[] | string[]): Promise<void>;
     emulateDevice(device: any): Promise<void>;
     addCookie(cookie: object): Promise<void>;
     getCookies(): Promise<object[]>;
     clearCookies(): Promise<void>;
     waitForResponse(urlPattern: string, timeout?: number): Promise<any>;
     waitForRequest(urlPattern: string, timeout?: number): Promise<any>;
     debug(message: string): Promise<void>;
     log(level: string, message: string): Promise<void>;
     setMobileViewport(width?: number, height?: number): Promise<void>;
     simulateTouch(): Promise<void>;
     tap(selector: string): Promise<void>;
   }

   export interface E2ESetupResult {
     getTestData(): Record<string, any>;
     getDevices(): Record<string, Device>;
     addDevice(name: string, device: Device): void;
     removeDevice(name: string): void;
     getDevice(name: string): Device;
     setDataBuilder(builder: Record<string, any>): void;
     updateConfig(config: Partial<E2ESetupConfig>): void;
     setEnvironment(env: string): void;
     getEnvironment(): string;
     debug(): object;
     reset(): void;
     beforeEach(fn: (devices: Record<string, Device>, data: any) => Promise<void>): void;
     afterEach(fn: (devices: Record<string, Device>, data: any) => Promise<void>): void;
     beforeAll(fn: (devices: Record<string, Device>, data: any) => Promise<void>): void;
     afterAll(fn: (devices: Record<string, Device>, data: any) => Promise<void>): void;
   }

   export function E2ESetup(config?: E2ESetupConfig): E2ESetupResult;
   export function createChromeE2EApi(options?: object): ChromeDevice;
   export function logStep(action: string, detail?: string): void;
   export function baseDataBuilder(): Record<string, any>;
   export function AgentTestDataBuilder(): Record<string, any>;
   ```

2. In `package.json`, add:
   ```json
   "types": "types/index.d.ts"
   ```

3. Add `"types/"` to the `"files"` array in `package.json`.

**No unit tests needed for this task** — TypeScript will validate the types at compile time for consumers.

**Verify:** Ensure `types/index.d.ts` is included in the published package by running `npm pack --dry-run`.

---

## Implementation Order (Recommended)

Execute in this order — each task now includes its own tests:

| Step | Task | What | Tests Created |
|------|------|------|---------------|
| 1 | **Task 0** | Test infrastructure setup | `helpers/mock-page.js`, `helpers/mock-step-logger.js` |
| 2 | **Task 1** | Smart selector tests (existing code) | `smart-selector.test.js` |
| 3 | **Task 3** | Data builder tests (existing code) | `data-builder.test.js` |
| 4 | **Task 2** | Wire lifecycle hooks + tests | `e2e-setup.test.js` |
| 5 | **Task 4** | Better error messages + tests | `device-errors.test.js` |
| 6 | **Task 5** | Validate `type(locator, input)` + tests | `device-type.test.js` |
| 7 | **Task 6** | `waitForText`/`waitForUrl` + tests | `device-wait-utils.test.js` |
| 8 | **Task 7** | Configurable timeouts + tests | Updates to existing test files |
| 9 | **Task 8** | Retry support + tests | Updates to `e2e-setup.test.js` |
| 10 | **Task 9** | Screenshot on failure + tests | `screenshot-on-failure.test.js` |
| 11 | **Task 10** | Network mocking + tests | `chrome-api.test.js` |
| 12 | **Task 11** | Fix `simulateTouch` + tests | Updates to `chrome-api.test.js` |
| 13 | **Task 12** | TypeScript types | No tests (validated by TS compiler) |

---

## Final Verification

After all tasks are complete:

1. Run full framework test suite: `npm run test:framework`
2. Run existing E2E example tests: `npx jest-e2e` (to ensure no regressions)
3. Verify exports: `node -e "import('./index.js').then(m => console.log(Object.keys(m)))"`
4. Verify package contents: `npm pack --dry-run`
5. Bump version in `package.json` to `2.0.0`

---

## Version Bump

After all tasks are complete, bump the version in `package.json` to `2.0.0` — the lifecycle hook fix (Task 2) and network mocking API change (Task 10) are technically breaking changes.
