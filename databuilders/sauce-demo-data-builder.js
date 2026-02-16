import { BaseDataBuilder } from "./base-data-builder.js";

class genSauceDemoDataBuilder extends BaseDataBuilder {
  constructor() {
    super();
    this.name = "SauceDemoDataBuilder";
    this.version = "1";

    this.genImp();
  }

  /**
   * @override
   * Generate test data for sauce-demo.myshopify.com
   */
  genImp() {
    this.baseUrl = "https://sauce-demo.myshopify.com";
    this.catalogUrl = "https://sauce-demo.myshopify.com/collections/all";
    this.loginUrl = "https://sauce-demo.myshopify.com/account/login";
    this.cartUrl = "https://sauce-demo.myshopify.com/cart";
    this.productUrl = "https://sauce-demo.myshopify.com/products/grey-jacket";

    // Products
    this.products = [
      { name: "Black heels", price: "£45.00" },
      { name: "Bronze sandals", price: "£39.99" },
      { name: "Brown Shades", price: "£20.00", soldOut: true },
      { name: "Grey jacket", price: "£55.00" },
      { name: "Noir jacket", price: "£60.00" },
      { name: "Striped top", price: "£50.00" },
      { name: "White sandals", price: "£25.00", soldOut: true },
    ];

    // Invalid login credentials (for testing error states)
    this.invalidEmail = "invalid@example.com";
    this.invalidPassword = "WrongPassword123";

    return this;
  }
}

export function SauceDemoDataBuilder() {
  return new genSauceDemoDataBuilder();
}
