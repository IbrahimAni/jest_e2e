/* eslint-disable no-undef */

"use strict";

import { AgentTestDataBuilder } from "../databuilders/agent-test-data-builder.js";

const { getTestData, getDevices } = E2ESetup({
  databuilder: AgentTestDataBuilder(),
  devices: {
    device: createChromeE2EApi({}),
  },
});

test("should demonstrate the new fluent expect API with .not modifier", async () => {
  const { device } = getDevices();
  const { userEmail } = getTestData();

  await device.navigate("https://anilathomes.com/login");

  await device.expect("email-input").toExist();
  await device.expect("password-input").toBeVisible();
  await device.expect("submit-button").toExist();

  await device.expect(".success-message").not.toExist();
  await device.expect(".error-banner").not.toBeVisible();

  await device.type("email-input", userEmail);
  await device.type("password-input", "testpass");

  await device.expect("email-input").toHaveValue(userEmail);
  await device.expect("email-input").not.toHaveValue("wrong@email.com");
  await device.expect("password-input").not.toHaveValue("wrongpass");
});
