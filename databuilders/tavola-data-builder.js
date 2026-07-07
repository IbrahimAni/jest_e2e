import { BaseDataBuilder } from "./base-data-builder.js";

class genTavolaDataBuilder extends BaseDataBuilder {
  constructor() {
    super();
    this.name = "TavolaDataBuilder";
    this.version = "1";

    this.genImp();
  }

  /**
   * @override
   * Generate test data for the Tavola demo app (framework smoke tests).
   * The app is a Next.js restaurant site backed by the DummyJSON API.
   */
  genImp() {
    this.baseUrl = "https://sonic-yarrow-57gs.here.now";
    this.menuUrl = `${this.baseUrl}/menu/`;
    this.reserveUrl = `${this.baseUrl}/reserve/`;
    this.loginUrl = `${this.baseUrl}/login/`;
    this.cartUrl = `${this.baseUrl}/cart/`;
    this.accountUrl = `${this.baseUrl}/account/`;

    // Demo credentials (shown on the app's login page)
    this.username = "emilys";
    this.password = "emilyspass";
    this.accountName = "Emily Johnson";
    this.invalidUsername = "not-a-user";
    this.invalidPassword = "wrong-password";

    // Reservation details — date must be in the future
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    this.reservationName = "Framework Smoke Test";
    this.reservationEmail = "smoke-test@example.com";
    this.reservationDate = future.toISOString().slice(0, 10);
    this.reservationTime = "19:00";

    return this;
  }
}

export function TavolaDataBuilder() {
  return new genTavolaDataBuilder();
}
