/**
 * Tavola: Cart Smoke Test
 *
 * Framework capabilities exercised:
 * - device.getText() for dynamic content
 * - device.expect().toBeVisible() (toast) and .toHaveText()
 * - Negated assertions: .not.toExist() waits for element removal
 * - Auto-waiting clicks on dynamically rendered buttons
 */

/* eslint-disable no-undef */
"use strict";

import { TavolaDataBuilder } from '../../databuilders/tavola-data-builder.js';

const { getTestData, getDevices } = E2ESetup({
  databuilder: TavolaDataBuilder(),
  devices: {
    device: createChromeE2EApi({}),
  },
});

test("User can add a dish to the cart, change quantity, and remove it", async () => {
  const { device } = getDevices();
  const { menuUrl, cartUrl } = getTestData();

  await device.navigate(menuUrl, { waitUntil: "networkidle0" });

  // Dish cards render after an API call — click auto-waits for the button
  const dishName = await device.getText("dish-name-1");
  await device.click("add-to-cart-1");

  // Toast confirms the add; cart badge appears in the navbar
  await device.expect("toast").toBeVisible();
  await device.expect("toast-message").toContain(dishName.trim());
  await device.expect("cart-badge").toHaveText("1");

  // Cart page shows the line item with quantity controls
  await device.navigate(cartUrl, { waitUntil: "networkidle0" });
  await device.expect("cart-line-1").toExist();
  await device.expect("cart-page").toContain(dishName.trim());

  // Increase quantity: value and badge update
  await device.click("cart-qty-1-inc");
  await device.expect("cart-qty-1-value").toHaveText("2");
  await device.expect("cart-badge").toHaveText("2");

  // Remove the line — negated assertions wait for removal
  await device.click("cart-remove-1");
  await device.expect("cart-line-1").not.toExist();
  await device.expect("cart-badge").not.toBeVisible();
  await device.expect("cart-empty").toExist();
});
