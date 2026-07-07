// Global setup for E2E testing
import { E2ESetup } from './e2e-setup.js';
import { createChromeE2EApi } from './chrome-api.js';
import { stepLogger } from './step-logger.js';
import { normalizeAutomationTab } from './tab-manager.js';

// Make core functions globally available
global.E2ESetup = E2ESetup;
global.createChromeE2EApi = createChromeE2EApi;
global.stepLogger = stepLogger;

beforeAll(async () => {
  await normalizeAutomationTab();
});

// Auto-start step logger for tests
const wrapWithStepLogger = (originalFn) => {
  const wrapped = function (name, fn, timeout) {
    return originalFn(name, async (...args) => {
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
  // Preserve test.only / test.skip / test.each / test.todo etc.
  Object.assign(wrapped, originalFn);
  return wrapped;
};

global.test = wrapWithStepLogger(global.test);
global.it = wrapWithStepLogger(global.it);

export {
  E2ESetup,
  createChromeE2EApi,
  stepLogger
}; 
