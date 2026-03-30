import { test, expect } from "@playwright/test";
import { registerUser } from "../../lib/datafactory/register";

// API tests for ToolShop application:https://api.practicesoftwaretesting.com/api/documentation#/




test("POST /users/login", async ({ request }) => {
  const email = `customer+${Date.now()}@practicesoftwaretesting.com`;
  const password = process.env.NEW_USER_PASSWORD! ;
  await registerUser(email, password);
  const response = await request.post("/users/login", {
    data: {
      email: email,
      password: password,
    },
  });
  const body = await response.json();
  expect(body.access_token).toBeTruthy();
  expect(response.status()).toBe(200);
});
