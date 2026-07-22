/**
 * Tavola: Reservation Form Smoke Test
 *
 * Framework capabilities exercised:
 * - device.fill() on date/time inputs (keyboard typing is locale-flaky there)
 * - device.clear() + re-type on text inputs
 * - device.type() on text inputs and textareas
 * - Validation error assertions via .toExist() / .not.toExist()
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

test("User sees validation errors, then completes a reservation", async () => {
  const { device } = getDevices();
  const {
    reserveUrl,
    reservationName,
    reservationEmail,
    reservationDate,
    reservationTime,
  } = getTestData();

  await device.navigate(reserveUrl, { waitUntil: "networkidle0" });

  // Submitting the empty form surfaces per-field validation errors
  await device.click("reserve-submit");
  await device.expect("error-name").toExist();
  await device.expect("error-email").toExist();
  await device.expect("error-date").toExist();
  await device.expect("error-time").toExist();

  // Fill the form; clear() + type() exercises value replacement
  await device.type("reserve-name", "Wrong Name");
  await device.clear("reserve-name");
  await device.type("reserve-name", reservationName);
  await device.expect("reserve-name").toHaveValue(reservationName);

  await device.type("reserve-email", reservationEmail);

  // fill() sets date/time values directly and fires input/change events
  await device.fill("reserve-date", reservationDate);
  await device.expect("reserve-date").toHaveValue(reservationDate);
  await device.fill("reserve-time", reservationTime);

  await device.type("reserve-notes", "Window seat if possible");

  await device.click("reserve-submit");

  // Confirmation replaces the form
  await device.expect("reservation-confirmation").toExist();
  await device.expect("reservation-confirmation").toContain(reservationName);
  await device.expect("reservation-id").toContain("RES-");
  await device.expect("reserve-form").not.toExist();
});
