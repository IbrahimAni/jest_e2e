import { jest } from '@jest/globals';

// Mock step logger to prevent console output during tests
export function mockStepLogger() {
  return jest.unstable_mockModule('../../config/step-logger.js', () => ({
    stepLogger: {
      step: jest.fn(),
      clear: jest.fn(),
    },
  }));
}
