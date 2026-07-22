/**
 * Tavola: Full Checkout Journey
 *
 * The complete user flow, end to end: browse the menu as a guest, add a
 * dish, sign in (the guest cart merges into the account), review the cart,
 * proceed to checkout, and fill in payment/delivery details up to the
 * "Place order" step.
 *
 * Framework capabilities exercised:
 * - Multi-page flow with device.navigate + waitForUrl
 * - Auto-waiting through a server-backed cart and a client-side login redirect
 * - Cart state surviving an authentication boundary
 * - device.type into a login form, device.fill into checkout inputs
 * - Assertions on pre-filled account details and the order summary
 *
 * Note: the demo app stubs the final order submission (clicking "Place order"
 * does not produce a confirmation), so the journey verifies the flow up to a
 * ready-to-pay checkout screen — i.e. everything up to and including payment
 * details, which is as far as the demo backend goes.
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

test("Guest adds a dish, signs in, and reaches a ready-to-pay checkout", async () => {
  const { device } = getDevices();
  const {
    menuUrl,
    loginUrl,
    cartUrl,
    checkoutUrl,
    username,
    password,
    accountName,
    checkoutEmail,
    deliveryPhone,
    deliveryAddress,
  } = getTestData();

  // 1. Browse the menu and add the first dish as a guest
  await device.navigate(menuUrl, { waitUntil: "networkidle0" });
  const dishName = (await device.getText("dish-name-1")).trim();
  await device.click("add-to-cart-1");
  await device.expect("cart-badge", { waitTimeout: 15000 }).toBeVisible();

  // 2. Sign in — the guest cart should merge into the account
  await device.navigate(loginUrl, { waitUntil: "networkidle0" });
  await device.type("login-username", username);
  await device.type("login-password", password);
  await device.click("login-submit");
  await device.waitForUrl("/account", { waitTimeout: 15000 });
  await device.expect("account-name").toContain(accountName);

  // 3. The merged cart still holds the dish added while signed out
  await device.navigate(cartUrl, { waitUntil: "networkidle0" });
  await device.expect("cart-line-1").toExist();
  await device.expect("cart-page").toContain(dishName);

  // 4. Proceed to checkout
  await device.navigate(checkoutUrl, { waitUntil: "networkidle0" });
  await device.expect("checkout-page").toExist();

  // Name and email are pre-filled from the signed-in account
  await device.expect("input-name").toHaveValue(accountName);
  await device.expect("input-email").toHaveValue(checkoutEmail);

  // The order summary reflects the item carried through from the guest cart
  await device.expect("order-summary").toContain(dishName);
  await device.expect("checkout-subtotal").toExist();

  // 5. Enter delivery details — device.fill drives the controlled inputs
  await device.fill("input-phone", deliveryPhone);
  await device.fill("input-address", deliveryAddress);
  await device.expect("input-phone").toHaveValue(deliveryPhone);
  await device.expect("input-address").toHaveValue(deliveryAddress);

  // 6. The payment step is ready: the place-order button shows the total
  await device.expect("place-order").toContain("Place order");
  await device.click("place-order");
});
