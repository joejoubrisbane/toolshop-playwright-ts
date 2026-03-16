import { test as setup, expect } from "@playwright/test";
import { registerUser } from "../../lib/datafactory/register";
import { LoginPage } from "../../lib/page/login.page";
setup("authenticate via api call", async ({ context, page, request }) => {
  const BASE_URL = "https://api.practicesoftwaretesting.com";
  const APP_URL = "https://practicesoftwaretesting.com"; // your UI base URL
  const adminAuthFile = ".auth/admin.json";

  // 1. Get the token via API

  const response = await request.post(`${BASE_URL}/users/login`, {
    data: {
      email: process.env.TEST_ADMIN_EMAIL,
      password: process.env.TEST_PASSWORD,
    },
  });

  const { access_token } = await response.json();
  expect(response.status()).toBe(200);
  expect(access_token).toBeTruthy();

  // 2. Navigate to the app so the origin exists in the browser context
  await page.goto(APP_URL, { waitUntil: "commit" });

  // 3. Inject the token into localStorage (match the key your app uses)
  await page.evaluate((token) => {
    localStorage.setItem("auth-token", token);
  }, access_token);

  // 4. Now save storage state — origins will be populated
  await context.storageState({ path: adminAuthFile });
});
setup("authenticate with new sign up user", async ({ page, context }) => {
  const loginPage = new LoginPage(page);
  const email = `customer+${Date.now()}@practicesoftwaretesting.com`;
  const password = process.env.NEW_USER_PASSWORD! ;
  const customer01AuthFile = ".auth/customer01.json";
  // You can add authentication logic here if needed
  // For now, this is a placeholder setup step
  await registerUser(email, password);
  await loginPage.goto();
  await loginPage.login(email, password);
  await context.storageState({ path: customer01AuthFile });
});
