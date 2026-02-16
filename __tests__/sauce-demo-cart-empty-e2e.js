/**
 * Sauce Demo: Empty Cart Test
 *
 * Validates:
 * - Cart page loads correctly
 * - Empty cart shows appropriate message
 * - "Continue Shopping" link is present and works
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

test("Empty cart shows message and link to continue shopping", async () => {
  const { device } = getDevices();
  const { cartUrl } = getTestData();

  // Navigate to cart page
  await device.navigate(cartUrl, { waitUntil: "networkidle0" });

  // Verify empty cart message is displayed
  await device.expect("body").toContain("your cart is currently empty");

  // Verify "Continue Shopping" link exists and points to catalog
  await device.expect('a[href="/collections/all"]').toExist();
  await device.expect("body").toContain("Continue Shopping");

  // Click "Continue Shopping" and verify navigation to catalog
  await device.click('a[href="/collections/all"]');
  await device.wait(2000);

  // Verify we're on the catalog page
  await device.expect("body").toContain("Catalog");
  await device.expect("body").toContain("Grey jacket");
});
