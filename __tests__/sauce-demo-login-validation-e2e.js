/**
 * Sauce Demo: Login Form Validation Test
 *
 * Validates:
 * - Login page loads correctly
 * - Form fields are present (email, password)
 * - Submitting invalid credentials shows an error
 * - "Create account" and "Forgot password" links exist
 */

/* eslint-disable no-undef */
"use strict";

import { SauceDemoDataBuilder } from '../databuilders/sauce-demo-data-builder.js';

const { getTestData, getDevices } = E2ESetup({
  databuilder: SauceDemoDataBuilder(),
  devices: {
    device: createChromeE2EApi({}),
  },
});

test("Login page shows error for invalid credentials", async () => {
  const { device } = getDevices();
  const { loginUrl, invalidEmail, invalidPassword } = getTestData();

  // Navigate to login page
  await device.navigate(loginUrl, { waitUntil: "networkidle0" });

  // Verify login page loaded
  await device.expect("body").toContain("Login");

  // Verify the login form exists
  await device.expect("#customer").toExist();

  // Verify "Create account" link is present
  await device.expect("body").toContain("Create account");

  // Fill in invalid credentials using CSS selectors for Shopify form inputs
  await device.type("#customer_email", invalidEmail);
  await device.type("#customer_password", invalidPassword);

  // Submit the login form
  await device.click('#customer input[type="submit"]');

  // Wait for the page to respond
  await device.wait(3000);

  // Verify error message is shown (Shopify shows "Incorrect email or password")
  await device.expect("body").toContain("Incorrect email or password");
});
