import { test, expect } from "@fixtures/pages.fixtures";
import { randomState } from "@helpers/stats";
import { CheckoutPage } from "@pages/checkout.page";
const searchTerm = "Combination Pliers";
const userInfo = {
  street: "123 Main St",
  city: "Anytown",
  state: randomState(),
  country: "Australia",
  postcode: "4109",
};

const paymentScenarios = [
  {
    method: "Buy Now Pay Later",
    setupPayment: async (checkoutPage: CheckoutPage) => {
      await checkoutPage.selectPaymentMethod("Buy Now Pay Later");
      await checkoutPage.selectMonthlyInstallments("3");
      await expect(checkoutPage.monthlyInstallmentsSelect).toHaveValue("3");
    },
  },
  {
    method: "Bank Transfer",
    setupPayment: async (checkoutPage: CheckoutPage) => {
      await checkoutPage.selectPaymentMethod("Bank Transfer");
      await checkoutPage.fillBankInformation({ bankName: "Test Bank", accountName: "John Doe", accountNumber: "123456789" });
    },
  },
  {
    method: "Cash on Delivery",
    setupPayment: async (checkoutPage: CheckoutPage) => {
      await checkoutPage.selectPaymentMethod("Cash on Delivery");
    },
  },
  {
    method: "Credit Card",
    setupPayment: async (checkoutPage: CheckoutPage) => {
      await checkoutPage.selectPaymentMethod("Credit Card");
      await checkoutPage.fillCreditCard({ number: "0000-0000-0000-0000", expiry: "12/2026", cvv: "123", cardholderName: "John Doe" });
    },
  },
  {
    method: "Gift Card",
    setupPayment: async (checkoutPage: CheckoutPage) => {
      await checkoutPage.selectPaymentMethod("Gift Card");
      await checkoutPage.fillGiftCardCode("GIFT123", "VALID123");
    },
  },
];

test.beforeEach(async ({ page }) => {
  // context is already logged in via workerUser storageState — just navigate
  await page.goto("/");
});

test.describe.parallel("User Checkout", () => {
  for (const { method, setupPayment } of paymentScenarios) {
    test(`should complete checkout with ${method}`, async ({ page, homePage, productPage, alertPage, navigationPage, checkoutPage }) => {
        await test.step("Search for product", async () => {
        await homePage.searchForProduct(searchTerm);
      });
      await test.step("Add product to cart", async () => {
        await productPage.clickProductItem(searchTerm);
        await productPage.clickAddToCartButton();
        await expect(alertPage.productAddedAlert).toBeVisible();
        await navigationPage.clickCartLink();
        await expect(navigationPage.cartQuantity).toHaveText("1");
      });

      await test.step("Fill billing address", async () => {
        await expect(checkoutPage.productTitle).toHaveText(searchTerm);
        await checkoutPage.clickProceedToCheckoutButton();
        await expect(checkoutPage.stepIndicator.filter({ hasText: "1" })).toHaveCSS("background-color", "rgb(51, 153, 51)");
        await checkoutPage.clickProceedToCheckoutButton();
        await expect(checkoutPage.stepIndicator.filter({ hasText: "2" })).toHaveCSS("background-color", "rgb(51, 153, 51)");
        await checkoutPage.fillBillingAddress(userInfo);
        await checkoutPage.clickProceedToCheckoutButton();
      });

      await test.step(`Select payment method and confirm order`, async () => {
        await setupPayment(checkoutPage);
        await checkoutPage.clickConfirmButton();
        await expect(alertPage.paymentSuccessAlert).toHaveText("Payment was successful");
        const invoiceResponsePromise = page.waitForResponse(
          (response) =>
            response.url().includes("/invoices") &&
            response.request().method() === "POST"
        );
        await checkoutPage.clickConfirmButton();
        const invoiceResponse = await invoiceResponsePromise;
        const { invoice_number } = await invoiceResponse.json();
        await expect(page.getByText("Thanks for your order! Your")).toContainText(invoice_number);
      });
    });
  }
});
