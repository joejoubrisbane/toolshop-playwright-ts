import { test, expect ,APIRequestContext } from "@playwright/test";

async function deleteProduct(request: APIRequestContext, token: string, id: string) {
  if (id) {
    await request.delete(`/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

test.describe("Products API", () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post("/users/login", {
      data: {
        email: process.env.TEST_ADMIN_EMAIL,
        password: process.env.TEST_PASSWORD,
      },
    });
    const { access_token } = await res.json();
    token = access_token;
  });

 


  test.describe("GET /products", () => {

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
  })





  
})
