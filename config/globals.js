// Global setup for E2E testing
import { E2ESetup } from './e2e-setup.js';
import { createChromeE2EApi } from './chrome-api.js';
import { stepLogger } from './step-logger.js';

// Make core functions globally available
global.E2ESetup = E2ESetup;
global.createChromeE2EApi = createChromeE2EApi;
global.stepLogger = stepLogger;

// Auto-start step logger for tests
const originalTest = global.test;
global.test = function(name, fn, timeout) {
  return originalTest(name, async (...args) => {
    stepLogger.start(name);
    try {
      const result = await fn(...args);
      stepLogger.success();
      return result;
    } catch (error) {
      stepLogger.error(error.message);
      throw error;
    }
  }, timeout);
};

export {
  E2ESetup,
  createChromeE2EApi,
  stepLogger
}; 