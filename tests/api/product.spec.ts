import { test, expect } from "@playwright/test";

test("GET /products id", async ({ request }) => {

  const response = await request.get("/products/search",{
    params: {
      q: "Combination Pliers",
    },
  });
  expect(response.status()).toBe(200);
  const body = await response.json()
  const id = body.data[0].id;
  const productResponse = await request.get(`/products/${id}`);
  expect(productResponse.status()).toBe(200);
  const productBody = await productResponse.json();
  expect(productBody.name).toBe("Combination Pliers");
});