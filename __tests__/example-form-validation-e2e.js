/**
 * EXAMPLE: Form Validation Test
 * 
 * This example demonstrates:
 * - Using the fluent expect API for assertions
 * - Element existence and visibility checking
 * - Value verification and negative assertions with .not
 * - Form interaction and state validation
 * - Best practices for UI testing
 */

/* eslint-disable no-undef */
"use strict";

import { AgentTestDataBuilder } from "../databuilders/agent-test-data-builder.js";

const { getTestData, getDevices } = E2ESetup({
  databuilder: AgentTestDataBuilder(),
  devices: {
    device: createChromeE2EApi({}),
  },
});

test("Form validation using fluent expect API", async () => {
  const { device } = getDevices();
  const { userEmail } = getTestData();

  // Navigate to the login form
  await device.navigate("https://anilathomes.com/login");

  // Verify form elements exist and are visible
  await device.expect("email-input").toExist();
  await device.expect("password-input").toBeVisible();
  await device.expect("submit-button").toExist();

  // Verify messages are not present initially (using .not modifier)
  await device.expect(".success-message").not.toExist();
  await device.expect(".error-banner").not.toBeVisible();

  // Fill the form with test data
  await device.type("email-input", userEmail);
  await device.type("password-input", "testpass");

  // Verify form values are correctly set
  await device.expect("email-input").toHaveValue(userEmail);
  
  // Demonstrate negative assertions
  await device.expect("email-input").not.toHaveValue("wrong@email.com");
  await device.expect("password-input").not.toHaveValue("wrongpass");
});
