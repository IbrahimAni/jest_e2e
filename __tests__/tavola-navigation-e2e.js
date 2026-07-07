/**
 * Tavola: Navigation Smoke Test
 *
 * Framework capabilities exercised:
 * - device.navigate() with waitUntil
 * - Smart selectors (data-testid shorthand + CSS attribute selectors)
 * - device.click() auto-wait on links
 * - device.waitForUrl()
 * - device.expect().toContain() / .toExist() / .toHaveCount()
 * - device.title()
 */

/* eslint-disable no-undef */
"use strict";

import { TavolaDataBuilder } from '../databuilders/tavola-data-builder.js';

const { getTestData, getDevices } = E2ESetup({
  databuilder: TavolaDataBuilder(),
  devices: {
    device: createChromeE2EApi({}),
  },
});

test("User can navigate from home to the menu and see dishes", async () => {
  const { device } = getDevices();
  const { baseUrl } = getTestData();

  await device.navigate(baseUrl, { waitUntil: "networkidle0" });

  // Page title and hero content
  const title = await device.title();
  expect(title).toContain("Tavola");
  await device.expect("home-title").toContain("Tavola");

  // CSS attribute selector pass-through: 5 meal shortcut links
  await device.expect('[data-testid^="meal-link-"]').toHaveCount(5);

  // Click the CTA (smart selector) and land on the menu page
  await device.click("cta-menu");
  await device.waitForUrl("/menu");

  // The menu grid loads dishes from the API — auto-wait covers the async load
  await device.expect("menu-grid").toExist();
  await device.waitFor("dish-card-12");
  await device.expect('[data-testid^="dish-card-"]').toHaveCount(12);
  await device.expect("menu-pagination-info").toExist();
});
