/**
 * EXAMPLE: Successful Login Test
 * 
 * This example demonstrates:
 * - Using E2ESetup() to initialize the test environment
 * - Using custom data builders for test data
 * - Basic device navigation and interaction
 * - Form filling and submission
 * - Content verification using expect assertions
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

test("User can login successfully with valid credentials", async () => {
  const { device } = getDevices();
  const { userEmail, userPassword } = getTestData();

  // Navigate to login page and wait for network to be idle
  await device.navigate("https://anilathomes.com/login", {
    waitUntil: "networkidle0",
  });

  // Fill login form using test data
  await device.type("email-input", userEmail);
  await device.type("password-input", userPassword);
  
  // Submit the form
  await device.click("submit-button");

  // Wait for page transition
  await device.wait(3000);

  // Verify successful login
  await device.expect("body").toContain("Agent Dashboard");
  await device.expect("body").not.toContain("Login Failed");
}); 