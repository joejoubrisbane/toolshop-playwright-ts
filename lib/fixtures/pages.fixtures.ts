import { test as base, BrowserContext } from "@playwright/test";
import { LoginPage } from "@pages/login.page";
import { HomePage } from "@pages/home.page";
import { ProductPage } from "@pages/product.page";
import { AlertPage } from "@pages/alert.page";
import { NavigationPage } from "@pages/navigation.page";
import { CheckoutPage } from "@pages/checkout.page";
import { SearchPage } from "@pages/search.page";
import { registerUser } from "@datafactory/register";

type WorkerUser = {
  email: string;
  password: string;
  storageState: Awaited<ReturnType<BrowserContext["storageState"]>>;
};

type PageFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  productPage: ProductPage;
  alertPage: AlertPage;
  navigationPage: NavigationPage;
  checkoutPage: CheckoutPage;
  searchPage: SearchPage;
};

type WorkerFixtures = {
  workerUser: WorkerUser;
};

export const test = base.extend<PageFixtures, WorkerFixtures>({
  // Runs once per worker — registers a user and saves logged-in browser state
  workerUser: [async ({ browser }, use) => {
    const email = `customer+${Date.now()}-${Math.random().toString(36).slice(2)}@practicesoftwaretesting.com`;
    const password = process.env.NEW_USER_PASSWORD!;
    await registerUser(email, password);

    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, password);
    const storageState = await context.storageState();
    await context.close();

    await use({ email, password, storageState });
  }, { scope: "worker" }],

  // Override context to inject the worker's logged-in storage state at creation time
  context: async ({ browser, workerUser }, use) => {
    const context = await browser.newContext({ storageState: workerUser.storageState });
    await use(context);
    await context.close();
  },

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
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
});

export { expect } from "@playwright/test";
