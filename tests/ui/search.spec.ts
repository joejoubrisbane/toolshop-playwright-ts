import { test, expect } from "@fixtures/pages.fixtures";
import { registerUser } from "@datafactory/register";
import { setSliderValue } from "@helpers/action";

test.beforeEach(async ({ page, loginPage }) => {
  const email = `customer+${Date.now()}-${Math.random().toString(36).slice(2)}@practicesoftwaretesting.com`;
  const password = process.env.NEW_USER_PASSWORD!;
  await registerUser(email, password);
  await loginPage.goto();
  await loginPage.login(email, password);
  await page.goto("/");
});

test.describe("Search Functionality", () => {
    test("should return relevant products when a search term is entered", async ({ searchPage }) => {
        const searchTerm = "Cordless Drill";
        await searchPage.searchForProduct(searchTerm);
        await expect(searchPage.page.getByTestId("search-term")).toContainText(searchTerm);
         const names = await searchPage.page.getByTestId("product-name").allTextContents();                                                                                    
  for (const name of names) {
    expect(name).toContain(searchTerm);                                                                                                  
  }
    });
    test("should return relevant products when a price range is entered", async ({ searchPage, page }) => {
        test.setTimeout(60_000);
        const minPrice = 35;
        const maxPrice = 50;

        const responsePromise = page.waitForResponse(
          (response) =>
            response.url().includes("/products") &&
            response.url().includes(`between=price,${minPrice},${maxPrice}`) &&
            response.request().method() === "GET"
        );

        await setSliderValue(searchPage.priceSliderMin, minPrice);
        await setSliderValue(searchPage.priceSliderMax, maxPrice);

        const response = await responsePromise;
        const body = await response.json();

        for (const product of body.data) {
          expect(product.price).toBeGreaterThanOrEqual(minPrice);
          expect(product.price).toBeLessThanOrEqual(maxPrice);
        }
    });
    test("should return relevant products when a category is selected", async ({ searchPage }) => {});
    test("should return relevant products when a brand is selected", async ({ searchPage }) => {});
});