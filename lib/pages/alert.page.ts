import { type Page, type Locator } from "@playwright/test";

export class AlertPage {
  readonly page: Page;
  readonly productAddedAlert: Locator;
  readonly paymentSuccessAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productAddedAlert = page.getByRole("alert", { name: "Product added to shopping" });
    this.paymentSuccessAlert = page.getByTestId("payment-success-message");
  }
}
