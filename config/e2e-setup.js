import fs from 'fs';
import path from 'path';

// E2E Setup - Main orchestrator for test configuration
class E2EConfiguration {
  constructor(config = {}) {
    this.config = config;
    this.dataBuilder = config.databuilder || null;
    this.devices = config.devices || {};
    this.initialized = false;
    
    // Store references for getters
    this._testData = null;
    this._deviceInstances = {};
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
    
    this.initialize();
  }

  initialize() {
    if (this.initialized) return;

    // Initialize data builder if provided
    if (this.dataBuilder) {
      this._testData = this.dataBuilder;
    }

    // Initialize devices
    Object.keys(this.devices).forEach(deviceName => {
      const deviceConfig = this.devices[deviceName];
      this._deviceInstances[deviceName] = deviceConfig;
    });

    this.initialized = true;
  }

  getTestData() {
    return this._testData;
  }

  getDevices() {
    return this._deviceInstances;
  }

  // Device management methods
  addDevice(name, deviceInstance) {
    this._deviceInstances[name] = deviceInstance;
    return this;
  }

  removeDevice(name) {
    delete this._deviceInstances[name];
    return this;
  }

  getDevice(name) {
    return this._deviceInstances[name];
  }

  // Data management methods
  setDataBuilder(dataBuilder) {
    this._testData = dataBuilder;
    return this;
  }

  // Configuration methods
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.initialize();
    return this;
  }

  // Utility methods for test lifecycle
  beforeEach(fn) {
    this.beforeEachHooks.push(fn);
    return this;
  }

  afterEach(fn) {
    this.afterEachHooks.push(fn);
    return this;
  }

  beforeAll(fn) {
    this.beforeAllHooks.push(fn);
    return this;
  }

  afterAll(fn) {
    this.afterAllHooks.push(fn);
    return this;
  }

  // Execute lifecycle hooks
  async runBeforeEach() {
    for (const hook of this.beforeEachHooks) {
      await hook(this.getDevices(), this.getTestData());
    }
  }

  async runAfterEach() {
    for (const hook of this.afterEachHooks) {
      await hook(this.getDevices(), this.getTestData());
    }
  }

  async runBeforeAll() {
    for (const hook of this.beforeAllHooks) {
      await hook(this.getDevices(), this.getTestData());
    }
  }

  async runAfterAll() {
    for (const hook of this.afterAllHooks) {
      await hook(this.getDevices(), this.getTestData());
    }
  }

  // Reset configuration
  reset() {
    this.dataBuilder = null;
    this.devices = {};
    this._testData = null;
    this._deviceInstances = {};
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
    this.initialized = false;
    return this;
  }

  // Environment-specific configurations
  setEnvironment(env) {
    this.environment = env;
    return this;
  }

  getEnvironment() {
    return this.environment || 'test';
  }

  // Debug and logging
  debug() {
    return {
      config: this.config,
      environment: this.getEnvironment(),
      devices: Object.keys(this._deviceInstances),
      hasDataBuilder: !!this._testData,
      initialized: this.initialized
    };
  }
}

// Main setup function
function E2ESetup(config = {}) {
  const e2eConfig = new E2EConfiguration(config);
  const screenshotOnFailure = config.screenshotOnFailure !== false;
  if (config.timeout) {
    global.__JEST_E2E_TIMEOUT__ = config.timeout;
  }
  const parsedActionDelayEnv = Number.parseInt(process.env.JEST_E2E_ACTION_DELAY || '', 10);
  const smoothMode = typeof config.smoothMode === 'boolean'
    ? config.smoothMode
    : process.env.JEST_E2E_SMOOTH === 'true';
  const actionDelay = typeof config.actionDelay === 'number'
    ? config.actionDelay
    : (Number.isNaN(parsedActionDelayEnv) ? undefined : parsedActionDelayEnv);
  const disableAnimations = typeof config.disableAnimations === 'boolean'
    ? config.disableAnimations
    : (process.env.JEST_E2E_DISABLE_ANIMATIONS === 'true' || smoothMode);

  global.__JEST_E2E_SMOOTH__ = smoothMode;
  if (typeof actionDelay === 'number') {
    global.__JEST_E2E_ACTION_DELAY__ = actionDelay;
  }
  global.__JEST_E2E_DISABLE_ANIMATIONS__ = disableAnimations;

  const parsedRetryEnv = Number.parseInt(process.env.JEST_E2E_RETRIES || '', 10);
  const retries = typeof config.retries === 'number'
    ? config.retries
    : (Number.isNaN(parsedRetryEnv) ? 0 : parsedRetryEnv);
  if (retries > 0 && global.jest && typeof global.jest.retryTimes === 'function') {
    global.jest.retryTimes(retries, { logErrorsBeforeRetry: true });
  }

  if (screenshotOnFailure && typeof global.afterEach === 'function') {
    global.afterEach(async () => {
      const testState = expect.getState();
      const hasFailed = typeof global.jasmine !== 'undefined' &&
        global.jasmine.currentTest?.failedExpectations?.length > 0;

      if (hasFailed && global.page) {
        const screenshotDir = path.join(process.cwd(), '__screenshots__');
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
        }

        const safeName = (testState?.currentTestName || 'unknown-test')
          .replace(/[^a-z0-9]/gi, '-')
          .toLowerCase();
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
  
  return {
    getTestData: () => e2eConfig.getTestData(),
    getDevices: () => e2eConfig.getDevices(),
    addDevice: (name, device) => e2eConfig.addDevice(name, device),
    removeDevice: (name) => e2eConfig.removeDevice(name),
    getDevice: (name) => e2eConfig.getDevice(name),
    setDataBuilder: (builder) => e2eConfig.setDataBuilder(builder),
    updateConfig: (newConfig) => e2eConfig.updateConfig(newConfig),
    setEnvironment: (env) => e2eConfig.setEnvironment(env),
    getEnvironment: () => e2eConfig.getEnvironment(),
    debug: () => e2eConfig.debug(),
    reset: () => e2eConfig.reset(),
    
    // Lifecycle methods
    beforeEach: (fn) => e2eConfig.beforeEach(fn),
    afterEach: (fn) => e2eConfig.afterEach(fn),
    beforeAll: (fn) => e2eConfig.beforeAll(fn),
    afterAll: (fn) => e2eConfig.afterAll(fn),
    
    // Internal configuration instance (for advanced usage)
    _config: e2eConfig
  };
}

export { E2ESetup, E2EConfiguration }; 
