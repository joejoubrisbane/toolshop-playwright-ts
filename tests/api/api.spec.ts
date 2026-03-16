import { test, expect } from "@playwright/test";

test("GET /products", async ({ request }) => {

  const response = await request.get("/products");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.data.length).toBe(9);
  expect(body.total).toBe(50);
});

test("POST /users/login", async ({ request }) => {

  const response = await request.post("/users/login", {
    data: {
      email: "customer@practicesoftwaretesting.com",
      password: "welcome01",
    },
  });
  const body = await response.json();
  expect(body.access_token).toBeTruthy();
  expect(response.status()).toBe(200);
});
