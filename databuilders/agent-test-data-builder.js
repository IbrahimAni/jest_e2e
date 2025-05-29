import { BaseDataBuilder } from "./base-data-builder.js";

class genAgentTestDataBuilder extends BaseDataBuilder {
  constructor() {
    super();
    this.name = "AgentTestDataBuilder";
    this.version = "1";

    this.genImp();
  }

  /**
   * @override
   * Generate/Implement the agent test data builder
   */
  genImp() {
    this.userEmail = "agent@anilathomes.com";
    this.userPassword = "Password.123$";
    return this;
  }
}

export function AgentTestDataBuilder() {
  return new genAgentTestDataBuilder();
}
