import { type Page } from "@playwright/test";

export class HomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async clickProductItem(productName: string) {
    await this.page.getByTestId("product-name").filter({ hasText: productName }).click();
  }
}
