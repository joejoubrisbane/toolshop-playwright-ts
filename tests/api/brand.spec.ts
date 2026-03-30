import { test, expect, APIRequestContext } from "@playwright/test";

async function createBrand(request: APIRequestContext, token: string): Promise<string> {
  const res = await request.post("/brands", {
    data: { name: Date.now() + "-brand", slug: Date.now() + "-slug" },
    headers: { Authorization: `Bearer ${token}` },
  });
  return (await res.json()).id;
}

async function deleteBrand(request: APIRequestContext, token: string, id: string) {
  if (id) {
    await request.delete(`/brands/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

test.describe("Brands API", () => {
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

  test.describe("GET /brands", () => {
    test("returns 200 with a list of brands", async ({ request }) => {
      const response = await request.get("/brands");
      expect(response.status()).toBe(200);
    });

    test("each brand has expected fields", async ({ request }) => {
      const response = await request.get("/brands");
      const body = await response.json();
      expect(body[0]).toHaveProperty("id");
      expect(body[0]).toHaveProperty("name");
      expect(body[0]).toHaveProperty("slug");
    });
  });

  test.describe("GET /brands/{brandId}", () => {
    test("returns 200 with the correct brand", async ({ request }) => {
      const response = await request.get("/brands");
      const body = await response.json();
      const brandId = body[0].id;
      const brandResponse = await request.get(`/brands/${brandId}`);
      expect(brandResponse.status()).toBe(200);
    });

    test("returns 404 for a non-existent ID", async ({ request }) => {
      const brandResponse = await request.get(`/brands/non-existent-123`);
      expect(brandResponse.status()).toBe(404);
    });
  });

  test.describe("POST /brands", () => {
    let postBrandId: string;

    test.afterEach(async ({ request }) => {
      await deleteBrand(request, token, postBrandId);
      postBrandId = "";
    });

    test("creates a new brand and returns 201", async ({ request }) => {
      const newBrand = { name: Date.now() + "new brand", slug: Date.now() + "new-brand" };
      const response = await request.post("/brands", { data: newBrand });
      expect(response.status()).toBe(201);
      const body = await response.json();
      postBrandId = body.id;
      expect(body.name).toBe(newBrand.name);
    });

    test("returns 405 when the method is not allowed for the requested route", async ({ request }) => {
      const response = await request.put("/brands", {
        data: { name: Date.now() + "new brand", slug: Date.now() + "new-brand" },
      });
      expect(response.status()).toBe(405);
    });
  });

  test.describe("PUT /brands/{brandId}", () => {
    let brandId: string;
    test.beforeEach(async ({ request }) => { brandId = await createBrand(request, token); });
    test.afterEach(async ({ request }) => { await deleteBrand(request, token, brandId); brandId = ""; });

    test("updates a brand and returns 200", async ({ request }) => {
      const brandResponse = await request.put(`/brands/${brandId}`, {
        data: { name: Date.now() + "updated brand", slug: Date.now() + "put-updated-brand" },
      });
      expect(brandResponse.status()).toBe(200);
    });
  });

  test.describe("PATCH /brands/{brandId}", () => {
    let brandId: string;
    test.beforeEach(async ({ request }) => { brandId = await createBrand(request, token); });
    test.afterEach(async ({ request }) => { await deleteBrand(request, token, brandId); brandId = ""; });

    test("partially updates a brand and returns 200", async ({ request }) => {
      const brandResponse = await request.patch(`/brands/${brandId}`, {
        data: { name: "patch new brand" },
      });
      const body = await brandResponse.json();
      expect(brandResponse.status()).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  test.describe("DELETE /brands/{brandId}", () => {
    let brandId: string;
    test.beforeEach(async ({ request }) => { brandId = await createBrand(request, token); });
    // afterEach guards against double-delete: the 204 test sets brandId = "" after consuming it
    test.afterEach(async ({ request }) => { await deleteBrand(request, token, brandId); brandId = ""; });

    test("deletes a brand and returns 204", async ({ request }) => {
      const brandResponse = await request.delete(`/brands/${brandId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(brandResponse.status()).toBe(204);
      brandId = ""; // already deleted — afterEach will skip
    });

    test("returns 401 without auth token", async ({ request }) => {
      const brandResponse = await request.delete(`/brands/${brandId}`);
      expect(brandResponse.status()).toBe(401);
    });
    
  });
});
