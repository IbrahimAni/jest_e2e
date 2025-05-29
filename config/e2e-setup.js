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
    this.beforeEachHook = fn;
    return this;
  }

  afterEach(fn) {
    this.afterEachHook = fn;
    return this;
  }

  beforeAll(fn) {
    this.beforeAllHook = fn;
    return this;
  }

  afterAll(fn) {
    this.afterAllHook = fn;
    return this;
  }

  // Execute lifecycle hooks
  async runBeforeEach() {
    if (this.beforeEachHook) {
      await this.beforeEachHook(this.getDevices(), this.getTestData());
    }
  }

  async runAfterEach() {
    if (this.afterEachHook) {
      await this.afterEachHook(this.getDevices(), this.getTestData());
    }
  }

  async runBeforeAll() {
    if (this.beforeAllHook) {
      await this.beforeAllHook(this.getDevices(), this.getTestData());
    }
  }

  async runAfterAll() {
    if (this.afterAllHook) {
      await this.afterAllHook(this.getDevices(), this.getTestData());
    }
  }

  // Reset configuration
  reset() {
    this.dataBuilder = null;
    this.devices = {};
    this._testData = null;
    this._deviceInstances = {};
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