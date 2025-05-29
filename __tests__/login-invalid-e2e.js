/* eslint-disable no-undef */

"use strict";

import { AgentTestDataBuilder } from '../databuilders/agent-test-data-builder.js';

const { getTestData, getDevices } = E2ESetup({
  databuilder: AgentTestDataBuilder(),
  devices: {
    device: createChromeE2EApi({}),
  },
});

test("should handle invalid login credentials", async () => {
  const { device } = getDevices();
  
  await device.navigate("https://anilathomes.com/login");

  await device.type("email-input", "invalid@example.com");
  await device.type("password-input", "wrongpassword");
  await device.click("submit-button");

  await device.wait(2000);

  const currentUrl = device.url();
  expect(currentUrl).toContain("/login");
}); 