import { BaseDataBuilder } from "./base-data-builder.js";

class GenfixsDataBuilderImpl extends BaseDataBuilder {
  constructor() {
    super();
    this.name = "GenfixsDataBuilder";
    this.version = "1";

    this.genImp();
  }

  /**
   * @override
   * Generate test data for genfixa.com
   */
  genImp() {
    this.baseUrl = "https://genfixs.com";
    this.loginUrl = "https://genfixs.com/login";
    this.signupUrl = "https://genfixs.com/signup";
    this.dashboardUrl = "https://genfixs.com/dashboard";

    // Valid signup payload (email is generated per test run to avoid collisions)
    this.firstName = "Test";
    this.lastName = "User";
    this.fullName = `${this.firstName} ${this.lastName}`;
    this.password = "Password.123$";
    this.confirmPassword = "Password.123$";
    this.phone = "08030000000";
    this.company = "Genfixs QA";
    this.generatedEmailPrefix = "qa.genfixs";

    // Invalid login credentials (for testing error states)
    this.invalidEmail = "invalid@example.com";
    this.invalidPassword = "WrongPassword123";

    return this;
  }

  getGeneratedEmail() {
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 10000);
    return `${this.generatedEmailPrefix}.${ts}.${rand}@example.com`;
  }
}

export function GenfixsDataBuilder() {
  return new GenfixsDataBuilderImpl();
}

// Backward-compatible aliases
export const genfixsDataBuilder = GenfixsDataBuilder;
export const genfixaDataBuilder = GenfixsDataBuilder;
