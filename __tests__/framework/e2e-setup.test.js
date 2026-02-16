import { jest } from '@jest/globals';
import { E2EConfiguration, E2ESetup } from '../../config/e2e-setup.js';

describe('E2EConfiguration', () => {
  test('initializes with default values', () => {
    const config = new E2EConfiguration();
    expect(config.getTestData()).toBeNull();
    expect(config.getDevices()).toEqual({});
    expect(config.initialized).toBe(true);
  });

  test('stores and retrieves test data and devices from config', () => {
    const testData = { userEmail: 'test@example.com' };
    const mockDevice = { click: () => {} };
    const config = new E2EConfiguration({
      databuilder: testData,
      devices: { browser: mockDevice },
    });

    expect(config.getTestData()).toEqual(testData);
    expect(config.getDevices()).toEqual({ browser: mockDevice });
  });

  test('supports multiple hooks per lifecycle event', async () => {
    const config = new E2EConfiguration();
    const calls = [];

    config.beforeEach(async () => calls.push('beforeEach-1'));
    config.beforeEach(async () => calls.push('beforeEach-2'));
    config.afterEach(async () => calls.push('afterEach-1'));
    config.afterEach(async () => calls.push('afterEach-2'));
    config.beforeAll(async () => calls.push('beforeAll-1'));
    config.beforeAll(async () => calls.push('beforeAll-2'));
    config.afterAll(async () => calls.push('afterAll-1'));
    config.afterAll(async () => calls.push('afterAll-2'));

    await config.runBeforeEach();
    await config.runAfterEach();
    await config.runBeforeAll();
    await config.runAfterAll();

    expect(calls).toEqual([
      'beforeEach-1',
      'beforeEach-2',
      'afterEach-1',
      'afterEach-2',
      'beforeAll-1',
      'beforeAll-2',
      'afterAll-1',
      'afterAll-2',
    ]);
  });
});

describe('E2ESetup lifecycle wiring', () => {
  const originalBeforeEach = global.beforeEach;
  const originalAfterEach = global.afterEach;
  const originalBeforeAll = global.beforeAll;
  const originalAfterAll = global.afterAll;

  afterEach(() => {
    global.beforeEach = originalBeforeEach;
    global.afterEach = originalAfterEach;
    global.beforeAll = originalBeforeAll;
    global.afterAll = originalAfterAll;
  });

  test('registers lifecycle wrappers that execute stored hooks', async () => {
    const callbacks = {
      beforeEach: null,
      afterEach: null,
      beforeAll: null,
      afterAll: null,
    };

    global.beforeEach = jest.fn((fn) => {
      callbacks.beforeEach = fn;
    });
    global.afterEach = jest.fn((fn) => {
      callbacks.afterEach = fn;
    });
    global.beforeAll = jest.fn((fn) => {
      callbacks.beforeAll = fn;
    });
    global.afterAll = jest.fn((fn) => {
      callbacks.afterAll = fn;
    });

    const devices = { browser: { click: () => {} } };
    const testData = { username: 'demo' };
    const setup = E2ESetup({ devices, databuilder: testData, screenshotOnFailure: false });

    const calls = [];
    setup.beforeEach(async (dev, data) => {
      calls.push(['beforeEach', dev, data]);
    });
    setup.afterEach(async (dev, data) => {
      calls.push(['afterEach', dev, data]);
    });
    setup.beforeAll(async (dev, data) => {
      calls.push(['beforeAll', dev, data]);
    });
    setup.afterAll(async (dev, data) => {
      calls.push(['afterAll', dev, data]);
    });

    await callbacks.beforeEach();
    await callbacks.afterEach();
    await callbacks.beforeAll();
    await callbacks.afterAll();

    expect(global.beforeEach).toHaveBeenCalledTimes(1);
    expect(global.afterEach).toHaveBeenCalledTimes(1);
    expect(global.beforeAll).toHaveBeenCalledTimes(1);
    expect(global.afterAll).toHaveBeenCalledTimes(1);

    expect(calls).toEqual([
      ['beforeEach', devices, testData],
      ['afterEach', devices, testData],
      ['beforeAll', devices, testData],
      ['afterAll', devices, testData],
    ]);
  });

  test('lifecycle wrappers are safe when no hooks were added', async () => {
    const callbacks = {};
    global.beforeEach = jest.fn((fn) => {
      callbacks.beforeEach = fn;
    });
    global.afterEach = jest.fn((fn) => {
      callbacks.afterEach = fn;
    });
    global.beforeAll = jest.fn((fn) => {
      callbacks.beforeAll = fn;
    });
    global.afterAll = jest.fn((fn) => {
      callbacks.afterAll = fn;
    });

    E2ESetup({ screenshotOnFailure: false });

    await expect(callbacks.beforeEach()).resolves.toBeUndefined();
    await expect(callbacks.afterEach()).resolves.toBeUndefined();
    await expect(callbacks.beforeAll()).resolves.toBeUndefined();
    await expect(callbacks.afterAll()).resolves.toBeUndefined();
  });
});

describe('E2ESetup configurable timeout', () => {
  const originalBeforeEach = global.beforeEach;
  const originalAfterEach = global.afterEach;
  const originalBeforeAll = global.beforeAll;
  const originalAfterAll = global.afterAll;

  beforeEach(() => {
    global.beforeEach = jest.fn();
    global.afterEach = jest.fn();
    global.beforeAll = jest.fn();
    global.afterAll = jest.fn();
  });

  afterEach(() => {
    global.beforeEach = originalBeforeEach;
    global.afterEach = originalAfterEach;
    global.beforeAll = originalBeforeAll;
    global.afterAll = originalAfterAll;
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

describe('E2ESetup smooth mode config', () => {
  const originalBeforeEach = global.beforeEach;
  const originalAfterEach = global.afterEach;
  const originalBeforeAll = global.beforeAll;
  const originalAfterAll = global.afterAll;

  beforeEach(() => {
    global.beforeEach = jest.fn();
    global.afterEach = jest.fn();
    global.beforeAll = jest.fn();
    global.afterAll = jest.fn();
  });

  afterEach(() => {
    global.beforeEach = originalBeforeEach;
    global.afterEach = originalAfterEach;
    global.beforeAll = originalBeforeAll;
    global.afterAll = originalAfterAll;
    delete global.__JEST_E2E_SMOOTH__;
    delete global.__JEST_E2E_ACTION_DELAY__;
    delete global.__JEST_E2E_DISABLE_ANIMATIONS__;
    delete process.env.JEST_E2E_SMOOTH;
    delete process.env.JEST_E2E_ACTION_DELAY;
    delete process.env.JEST_E2E_DISABLE_ANIMATIONS;
  });

  test('sets smooth globals from config', () => {
    E2ESetup({ smoothMode: true, actionDelay: 45, disableAnimations: true });
    expect(global.__JEST_E2E_SMOOTH__).toBe(true);
    expect(global.__JEST_E2E_ACTION_DELAY__).toBe(45);
    expect(global.__JEST_E2E_DISABLE_ANIMATIONS__).toBe(true);
  });

  test('uses env fallback when config not provided', () => {
    process.env.JEST_E2E_SMOOTH = 'true';
    process.env.JEST_E2E_ACTION_DELAY = '35';
    process.env.JEST_E2E_DISABLE_ANIMATIONS = 'true';
    E2ESetup({});
    expect(global.__JEST_E2E_SMOOTH__).toBe(true);
    expect(global.__JEST_E2E_ACTION_DELAY__).toBe(35);
    expect(global.__JEST_E2E_DISABLE_ANIMATIONS__).toBe(true);
  });
});

describe('E2ESetup retry support', () => {
  const originalBeforeEach = global.beforeEach;
  const originalAfterEach = global.afterEach;
  const originalBeforeAll = global.beforeAll;
  const originalAfterAll = global.afterAll;
  const originalJestGlobal = global.jest;
  let mockRetryTimes;

  beforeEach(() => {
    mockRetryTimes = jest.fn();
    global.jest = { retryTimes: mockRetryTimes };
    global.beforeEach = jest.fn();
    global.afterEach = jest.fn();
    global.beforeAll = jest.fn();
    global.afterAll = jest.fn();
  });

  afterEach(() => {
    global.beforeEach = originalBeforeEach;
    global.afterEach = originalAfterEach;
    global.beforeAll = originalBeforeAll;
    global.afterAll = originalAfterAll;
    global.jest = originalJestGlobal;
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
