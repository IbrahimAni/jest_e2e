// Base Data Builder - Foundation for all data builders
export class BaseDataBuilder {
  constructor() {
    this.version = "1";
    this.name = "BaseDataBuilder";
  }

  /**
   * @override
   * Generate/Implement the data builder
   * This method should be overridden by concrete data builders
   */
  genImp() {
    throw new Error(`genImp() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Get the current version of the data builder
   * @returns {string} Current version
   */
  getVersion() {
    return this.version;
  }
}