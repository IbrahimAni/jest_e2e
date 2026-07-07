// Main entry point for jest-e2e package
export { E2ESetup } from './config/e2e-setup.js';
export { logStep } from './config/step-logger.js';
export { createChromeE2EApi } from './config/chrome-api.js';

// Export data builders
export { baseDataBuilder } from './databuilders/base-data-builder.js';
export { AgentTestDataBuilder } from './databuilders/agent-test-data-builder.js';

// Version (kept in sync with package.json)
import { createRequire } from 'module';
export const version = createRequire(import.meta.url)('./package.json').version;
