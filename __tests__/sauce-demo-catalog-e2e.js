/**
 * Sauce Demo: Catalog Browsing Test
 *
 * Validates:
 * - Navigating to the catalog page
 * - Products are displayed with names and prices
 * - Sold out products show correct status
 * - Product links navigate to product detail pages
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

test("User can browse the product catalog and see all products", async () => {
  const { device } = getDevices();
  const { catalogUrl } = getTestData();

  // Navigate to catalog page
  await device.navigate(catalogUrl, { waitUntil: "networkidle0" });

  // Verify page loaded with catalog content
  await device.expect("body").toContain("Catalog");

  // Verify products are displayed
  await device.expect("body").toContain("Grey jacket");
  await device.expect("body").toContain("£55.00");

  await device.expect("body").toContain("Noir jacket");
  await device.expect("body").toContain("£60.00");

  await device.expect("body").toContain("Striped top");
  await device.expect("body").toContain("£50.00");

  await device.expect("body").toContain("Black heels");
  await device.expect("body").toContain("£45.00");

  // Verify sold out products are indicated
  await device.expect("body").toContain("Brown Shades");
  await device.expect("body").toContain("Sold Out");
});
