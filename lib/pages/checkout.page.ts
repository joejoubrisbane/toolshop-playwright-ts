import { type Page, type Locator } from "@playwright/test";

export class CheckoutPage {
  readonly page: Page;
  // product-title is a display-only <span> with no ARIA role; use getByText in assertions
  readonly productTitle: Locator;
  readonly stepIndicator: Locator;
  readonly proceedButton: Locator;
  readonly confirmButton: Locator;
  readonly paymentMethodSelect: Locator;
  readonly monthlyInstallmentsSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productTitle = page.getByTestId("product-title");
    this.stepIndicator = page.locator(".step-indicator");
    this.proceedButton = page.getByRole("button", { name: "Proceed to checkout" });
    this.confirmButton = page.getByRole("button", { name: "Confirm" });
    this.paymentMethodSelect = page.getByLabel("Payment Method");
    this.monthlyInstallmentsSelect = page.getByLabel("Monthly installments");
  }

  async clickProceedToCheckoutButton() {
    await this.proceedButton.click();
  }

  async clickConfirmButton() {
    await this.confirmButton.click();
  }

  async fillBillingAddress(address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postcode: string;
  }) {
    await this.page.getByPlaceholder("Your Street *").fill(address.street);
    await this.page.getByPlaceholder("Your City *").fill(address.city);
    await this.page.getByPlaceholder("State *").fill(address.state);
    await this.page.getByPlaceholder("Your country *").fill(address.country);
    await this.page.getByPlaceholder("Your Postcode *").fill(address.postcode);
  }

  async selectPaymentMethod(method: string) {
    await this.paymentMethodSelect.selectOption({ label: method });
  }

  async selectMonthlyInstallments(value: string) {
    await this.monthlyInstallmentsSelect.selectOption(value);
  }

  async fillBankInformation(info: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  }) {
    await this.page.getByPlaceholder("Bank Name").fill(info.bankName);
    await this.page.getByPlaceholder("Account Name").fill(info.accountName);
    await this.page.getByPlaceholder("Account Number").fill(info.accountNumber);
  }

  async fillCreditCard(info: {
    number: string;
    expiry: string;
    cvv: string;
    cardholderName: string;
  }) {
    await this.page.getByPlaceholder("Credit Card Number").fill(info.number);
    await this.page.getByPlaceholder("Expiration Date").fill(info.expiry);
    await this.page.getByPlaceholder("CVV").fill(info.cvv);
    await this.page.getByPlaceholder("Card Holder Name").fill(info.cardholderName);
  }

  async fillGiftCardCode(giftCardCode: string, validationCode: string) {
    await this.page.getByPlaceholder("Gift Card Number").fill(giftCardCode);
    await this.page.getByPlaceholder("Validation Code").fill(validationCode);
  }
}
