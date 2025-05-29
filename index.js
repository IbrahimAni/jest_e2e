// Main entry point for jest-e2e package
export { E2ESetup } from './config/e2e-setup.js';
export { getTestData } from './config/data-builder.js';
export { getDevices } from './config/device.js';
export { logStep } from './config/step-logger.js';

// Export data builders
export { baseDataBuilder } from './databuilders/base-data-builder.js';
export { defaultDataBuilder } from './databuilders/default-data-builder.js';
export { realEstateDataBuilder } from './databuilders/real-estate-data-builder.js';
export { userEmail, userPassword, userFullName, agentName, agentEmail } from './databuilders/agent-test-data-builder.js';

// Version
export const version = '1.0.0'; 