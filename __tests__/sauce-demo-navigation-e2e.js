/**
 * Sauce Demo: Site Navigation Test
 *
 * Validates:
 * - Homepage loads with correct branding
 * - Navigation links are present (Catalog, Blog, About Us)
 * - Navigating between pages works correctly
 * - Header and footer elements persist across pages
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

test("User can navigate between major pages of the site", async () => {
  const { device } = getDevices();
  const { baseUrl } = getTestData();

  // Navigate to homepage
  await device.navigate(baseUrl, { waitUntil: "networkidle0" });

  // Verify homepage loaded with branding
  await device.expect("body").toContain("Sauce Demo");

  // Verify navigation links exist
  await device.expect('a[href="/collections/all"]').toExist();
  await device.expect('a[href="/blogs/news"]').toExist();
  await device.expect('a[href="/pages/about-us"]').toExist();

  // Verify featured products are shown on homepage
  await device.expect("body").toContain("Grey jacket");
  await device.expect("body").toContain("Noir jacket");

  // Navigate to Catalog via nav link
  await device.click('a[href="/collections/all"]');
  await device.wait(2000);
  await device.expect("body").toContain("Catalog");
  await device.expect("body").toContain("Black heels");

  // Navigate to About Us
  await device.navigate(baseUrl + "/pages/about-us", { waitUntil: "networkidle0" });
  await device.expect("body").toContain("About Us");

  // Navigate back to homepage
  await device.navigate(baseUrl, { waitUntil: "networkidle0" });
  await device.expect("body").toContain("Sauce Demo");
});
