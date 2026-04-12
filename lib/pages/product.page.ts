import { type Page, type Locator } from "@playwright/test";

export class ProductPage {
  readonly page: Page;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addToCartButton = page.getByRole("button", { name: "Add to cart" });
  }

  async clickAddToCartButton() {
    await this.addToCartButton.click();
  }

  async clickProductItem(productName: string) {
    await this.page.getByTestId("product-name").filter({ hasText: productName }).click();
  }
}
