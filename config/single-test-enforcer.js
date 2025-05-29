// Single Test Enforcer - Ensures only one test() function per file
import path from "path";

// Track test registrations per file
const fileTestCounts = new Map();

// Override the global test function
const originalTest = global.test;
const originalIt = global.it;

function createTestEnforcer(originalFn) {
  return function (name, fn, timeout) {
    // Get the current test file name from Jest's environment
    const testPath = expect.getState().testPath;

    if (testPath) {
      const fileName = path.basename(testPath);
      const currentCount = fileTestCounts.get(testPath) || 0;
      fileTestCounts.set(testPath, currentCount + 1);

      // Enforce single test rule
      if (currentCount >= 1) {
        const error = new Error(`
🚫 SINGLE TEST RULE VIOLATION 🚫

File: ${fileName}
Error: Only ONE test() function is allowed per file.

This file already has ${currentCount + 1} test functions.

✅ CORRECT PATTERN:
Each file should contain:
- One E2ESetup() configuration
- One test() function
        `);

        // Make the error more visible
        console.error("\n" + "=".repeat(60));
        console.error(error.message);
        console.error("=".repeat(60) + "\n");

        throw error;
      }
    }

    return originalFn.call(this, name, fn, timeout);
  };
}

// Override both test and it functions
global.test = createTestEnforcer(originalTest);
global.it = createTestEnforcer(originalIt);

// Clear counts when a new test file starts
beforeAll(() => {
  const testPath = expect.getState().testPath;
  if (testPath) {
    fileTestCounts.delete(testPath);
  }
});

export { fileTestCounts };
