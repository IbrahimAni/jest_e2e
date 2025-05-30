// Main entry point for jest-e2e package
export { E2ESetup } from './config/e2e-setup.js';
export { logStep } from './config/step-logger.js';
export { createChromeE2EApi } from './config/chrome-api.js';

// Export data builders
export { baseDataBuilder } from './databuilders/base-data-builder.js';
export { AgentTestDataBuilder } from './databuilders/agent-test-data-builder.js';

// Version
export const version = '1.0.2'; 