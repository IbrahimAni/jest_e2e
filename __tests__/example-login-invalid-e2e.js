/**
 * EXAMPLE: Invalid Login Test
 * 
 * This example demonstrates:
 * - Testing error scenarios and validation
 * - Using hardcoded test data for specific test cases
 * - Verifying error states and failed authentication
 * - URL-based assertions for redirect verification
 */

/* eslint-disable no-undef */
"use strict";

import { AgentTestDataBuilder } from '../databuilders/agent-test-data-builder.js';

const { getTestData, getDevices } = E2ESetup({
  databuilder: AgentTestDataBuilder(),
  devices: {
    device: createChromeE2EApi({}),
  },
});

test("Login should fail with invalid credentials", async () => {
  const { device } = getDevices();
  
  // Navigate to login page
  await device.navigate("https://anilathomes.com/login");

  // Use invalid credentials to test error handling
  await device.type("email-input", "invalid@example.com");
  await device.type("password-input", "wrongpassword");
  await device.click("submit-button");

  // Wait for server response
  await device.wait(2000);

  // Verify user remains on login page (no redirect)
  const currentUrl = device.url();
  expect(currentUrl).toContain("/login");
}); 