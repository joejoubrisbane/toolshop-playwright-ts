import { type Page, Locator } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly searchInput: Locator;


  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByTestId("search-query");
  }

  async searchForProduct(productName: string) {
    await this.searchInput.fill(productName);
    await this.page.getByRole("button", { name: "Search " }).click();
  }

  async clickProductItem(productName: string) {
    await this.page.getByTestId("product-name").filter({ hasText: productName }).click();
  }
}
