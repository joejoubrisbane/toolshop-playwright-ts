import { type Page, type Locator } from "@playwright/test";

export class ProductPage {
  readonly page: Page;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addToCartButton = page.getByTestId("add-to-cart");
  }

  async clickAddToCartButton() {
    await this.addToCartButton.click();
  }
}
