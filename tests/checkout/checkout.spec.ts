import { test, expect } from "@playwright/test";
test.use({ storageState: ".auth/customer01.json" });
test.beforeEach(async ({ page }) => {
  await page.goto("https://practicesoftwaretesting.com");
});
test.describe("User Checkout", () => {
  test("should allow a user to complete the checkout process", async ({ page, headless }) => {
    // Navigate to the homepage and search for "Combination Pliers"
    await page.getByAltText("Combination Pliers").click();
    await page.getByRole("button", { name: "Add to Cart" }).click();
    await expect(page.getByRole("alert", { name: "Product added to shopping" })).toBeVisible();
    await page.getByTestId("nav-cart").click();
    await expect(page.getByTestId("product-name")).toHaveText("Combination Pliers");
    await expect(page.getByTestId("product-quantity")).toHaveValue("1");
    
    await page.getByRole("button", { name: "Proceed to checkout" }).click();
    
    await page.getByTestId('proceed-2').click();
    await expect(page.locator(".step-indicator").filter({ hasText: "2" })).toHaveCSS("background-color", "rgb(51, 153, 51)");
    await page.getByPlaceholder("State *").fill("QLD");
    await page.getByPlaceholder("Your country *").fill("Australia");
    await page.getByPlaceholder("Your Postcode *").fill("4109");
     await page.getByRole("button", { name: "Proceed to checkout" }).click();
    await page.getByTestId('payment-method').selectOption('buy-now-pay-later');
    await page.getByTestId('monthly_installments').selectOption('3');
    await page.getByTestId('finish').click();
    await expect(page.getByTestId('payment-success-message')).toHaveText('Payment was successful');
    headless? await test.step("Visual Test: Verify order confirmation page", async () => {
      await expect(page).toHaveScreenshot("order-confirmation.png", { mask: [page.getByTitle("Practice Software Testing - Toolshop")] });
    }): console.log("Skipping visual test in headed mode");                               
    await page.getByRole("button", { name: " Confirm " }).click();
    await expect(page.getByText('Thanks for your order! Your')).toBeVisible();
  });
});