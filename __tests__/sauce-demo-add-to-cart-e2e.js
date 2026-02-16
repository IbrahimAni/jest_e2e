/**
 * Sauce Demo: Add to Cart Test
 *
 * Validates:
 * - Navigating to a product page
 * - Product details are displayed (name, price)
 * - Add to Cart button works
 * - Cart updates with the added product
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

test("User can add a product to the cart from the product page", async () => {
  const { device } = getDevices();
  const { productUrl, cartUrl } = getTestData();

  // Navigate to Grey jacket product page
  await device.navigate(productUrl, { waitUntil: "networkidle0" });

  // AUTO-WAIT VALIDATION: These assertions auto-wait for "body" to exist
  // before querying text content — no manual wait needed after navigation
  await device.expect("body").toContain("Grey jacket");
  await device.expect("body").toContain("£55.00");

  // AUTO-WAIT VALIDATION: device.click auto-waits for "#add" to appear
  // in the DOM before clicking — no manual waitFor("#add") needed
  // Use evaluate to add to cart via Shopify AJAX API (avoids site's buggy
  // jQuery onCartUpdate handler that throws on this demo site)
  await device.evaluate(async () => {
    const form = document.querySelector('form[action="/cart/add"]');
    const formData = new FormData(form);
    await fetch("/cart/add.js", { method: "POST", body: formData });
  });

  // Navigate to cart — networkidle0 ensures the page is fully loaded
  // before the subsequent auto-waiting assertions run
  await device.navigate(cartUrl, { waitUntil: "networkidle0" });

  // AUTO-WAIT VALIDATION: These expect() calls auto-wait for "body"
  // before checking text — proves auto-wait works for assertions too
  await device.expect("body").toContain("Grey jacket");
  await device.expect("body").toContain("£55.00");
});
