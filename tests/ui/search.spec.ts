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
    test("Validate product data is visible from modified API response", async ({ searchPage, page }) => {
        await test.step("overwirte /products API response to include additional product details", async () => {
            await page.route(`${process.env.API_URL || "https://api.practicesoftwaretesting.com"}/products*`, async(route) => {
                const response = await route.fetch();
                const json = await response.json();
                json.data[0]["name"] = "Modified Product Name";
                json.data[0]["price"] = 99.99;
                json.data[0]["description"] = "Modified Product Description";
                json.data[0]["in_stock"] = false;
                await route.fulfill({ response,json });
            });
        });
        await page.goto("/");
        await page.waitForURL("/");
        await expect(searchPage.productNames.first()).toHaveText("Modified Product Name");
        await searchPage.clickProductItem("Modified Product Name");
    });
     test("Validate product data is loaded from har file", async ({ searchPage, page }) => {
        await test.step("mock /products", async () => {
            await page.routeFromHAR(".har/products.har", {
                url: `${process.env.API_URL || "https://api.practicesoftwaretesting.com"}/products*`,
                update: false,
            }); 
        });
        await page.goto("/");
        await page.waitForURL("/");
      await expect(searchPage.productNames.first()).toHaveText("Happy Path Product");
    });
});