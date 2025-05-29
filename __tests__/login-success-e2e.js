/* eslint-disable no-undef */

"use strict";

import { AgentTestDataBuilder } from '../databuilders/agent-test-data-builder.js';

const { getTestData, getDevices } = E2ESetup({
  databuilder: AgentTestDataBuilder(),
  devices: {
    device: createChromeE2EApi({}),
  },
});

test("should login successfully and verify Agent Dashboard", async () => {
  const { device } = getDevices();
  const { userEmail, userPassword } = getTestData();

  await device.navigate("https://anilathomes.com/login", {
    waitUntil: "networkidle0",
  });

  await device.type("email-input", userEmail);
  await device.type("password-input", userPassword);
  await device.click("submit-button");

  await device.wait(3000);

  await device.expect("body").toContain("Agent Dashboard");
  await device.expect("body").not.toContain("Login Failed");
}); 