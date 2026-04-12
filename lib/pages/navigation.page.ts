import { type Page, type Locator } from "@playwright/test";

export class NavigationPage {
  readonly page: Page;
  readonly cartLink: Locator;
  readonly cartQuantity: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartLink = page.getByRole("link", { name: "cart" });
    this.cartQuantity = page.getByTestId("cart-quantity");
  }

  async clickCartLink() {
    await this.cartLink.click();
  }
}
