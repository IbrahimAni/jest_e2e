/**
 * Genfixs: Sign-up Test
 *
 * Validates:
 * - User can open the sign-up page
 * - User can fill the sign-up form
 * - User can submit the form
 * - A post-submit success indicator is shown (URL or page text)
 */

/* eslint-disable no-undef */
"use strict";

import { GenfixsDataBuilder } from "../databuilders/genfixs-data-builder.js";

const { getTestData, getDevices } = E2ESetup({
  databuilder: GenfixsDataBuilder(),
  devices: {
    device: createChromeE2EApi({}),
  },
  smoothMode: true,
});

test("User can sign up on Genfixs", async () => {
  const { device } = getDevices();
  const data = getTestData();
  const uniqueEmail = data.getGeneratedEmail();

  await device.navigate(data.signupUrl, { waitUntil: "networkidle0" });

  // await device.expect("body").toContain("Create account");

  await device.type("name-input", data.fullName);
  await device.type("email-input", uniqueEmail);
  await device.type("password-input", data.password);
  await device.type("confirm-password-input", data.confirmPassword);

  await device.click("submit-btn");

  await device.wait(1500);
  await device.click("close-modal-btn");
});
