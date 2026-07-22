/**
 * Tavola: Login Smoke Test
 *
 * Framework capabilities exercised:
 * - device.type() into inputs, device.getValue()
 * - device.press() — submitting a form with Enter
 * - Error state assertion (.toBeVisible()) then recovery (.not.toExist())
 * - device.waitForUrl() after client-side redirect
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

test("User sees an error on bad credentials, then signs in with Enter key", async () => {
  const { device } = getDevices();
  const {
    loginUrl,
    username,
    password,
    accountName,
    invalidUsername,
    invalidPassword,
  } = getTestData();

  await device.navigate(loginUrl, { waitUntil: "networkidle0" });
  await device.expect("demo-credentials").toContain(username);

  // Wrong credentials → visible error
  await device.type("login-username", invalidUsername);
  await device.type("login-password", invalidPassword);
  await device.click("login-submit");
  await device.expect("login-error", { waitTimeout: 10000 }).toBeVisible();

  // Fix the credentials: clear + retype, then submit by pressing Enter
  await device.clear("login-username");
  await device.type("login-username", username);
  const typedUsername = await device.getValue("login-username");
  expect(typedUsername).toBe(username);

  await device.clear("login-password");
  await device.type("login-password", password);
  await device.press("login-password", "Enter");

  // Client-side redirect to the account page
  await device.waitForUrl("/account", { waitTimeout: 15000 });
  await device.expect("account-name").toContain(accountName);
  await device.expect("login-error").not.toExist();
});
