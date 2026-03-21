import { test as base } from "@playwright/test";
import { LoginPage } from "@pages/login.page";
import { HomePage } from "@pages/home.page";
import { ProductPage } from "@pages/product.page";
import { AlertPage } from "@pages/alert.page";
import { NavigationPage } from "@pages/navigation.page";
import { CheckoutPage } from "@pages/checkout.page";

type PageFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  productPage: ProductPage;
  alertPage: AlertPage;
  navigationPage: NavigationPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  alertPage: async ({ page }, use) => {
    await use(new AlertPage(page));
  },
  navigationPage: async ({ page }, use) => {
    await use(new NavigationPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect } from "@playwright/test";
