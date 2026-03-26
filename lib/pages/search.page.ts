import { type Page, Locator } from "@playwright/test";

export class SearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly priceSliderMin: Locator;
  readonly priceSliderMax: Locator
  readonly searchButton: Locator;
  readonly productNames: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByTestId("search-query");
    this.searchButton = page.getByTestId("search-submit");
    this.priceSliderMin = page.getByRole('slider', { name: 'ngx-slider', exact: true });
    this.priceSliderMax = page.getByRole('slider', { name: 'ngx-slider-max', exact: true });
    this.productNames = page.getByTestId("product-name");
  }

  async searchForProduct(productName: string) {
    await this.searchInput.fill(productName);
    await this.page.getByRole("button", { name: "Search " }).click();
  }

  async clickProductItem(productName: string) {
    await this.page.getByTestId("product-name").filter({ hasText: productName }).click();
  }
}