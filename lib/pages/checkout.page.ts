import { type Page, type Locator } from "@playwright/test";

export class CheckoutPage {
  readonly page: Page;
  readonly productTitle: Locator;
  readonly stepIndicator: Locator;
  readonly proceedButton: Locator;
  readonly confirmButton: Locator;
  readonly paymentMethodSelect: Locator;
  readonly monthlyInstallmentsSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productTitle = page.getByTestId("product-title");
    this.stepIndicator = page.locator(".step-header-circle");
    this.proceedButton = page.getByTestId("proceed-1");
    this.confirmButton = page.getByTestId("finish");
    this.paymentMethodSelect = page.getByTestId("payment-method");
    this.monthlyInstallmentsSelect = page.getByTestId("monthly-installments-plan");
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
    await this.page.getByTestId("address").fill(address.street);
    await this.page.getByTestId("city").fill(address.city);
    await this.page.getByTestId("state").fill(address.state);
    await this.page.getByTestId("country").selectOption({ label: address.country });
    await this.page.getByTestId("postcode").fill(address.postcode);
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
    await this.page.getByTestId("bank-name").fill(info.bankName);
    await this.page.getByTestId("account-name").fill(info.accountName);
    await this.page.getByTestId("account-number").fill(info.accountNumber);
  }

  async fillCreditCard(info: {
    number: string;
    expiry: string;
    cvv: string;
    cardholderName: string;
  }) {
    await this.page.getByTestId("credit-card-number").fill(info.number);
    await this.page.getByTestId("expiry-date").fill(info.expiry);
    await this.page.getByTestId("cvv").fill(info.cvv);
    await this.page.getByTestId("card-holder-name").fill(info.cardholderName);
  }

  async fillGiftCardCode(giftCardCode: string, validationCode: string) {
    await this.page.getByTestId("gift-card-number").fill(giftCardCode);
    await this.page.getByTestId("validation-code").fill(validationCode);
  }
}
