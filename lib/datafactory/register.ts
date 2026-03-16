import { request , expect } from "@playwright/test";

export async function registerUser(email: string, password: string) {
  const apiUrl = process.env.API_URL;
  const createRequestContext = await request.newContext();
  const response = await createRequestContext.post(`${apiUrl}/users/register`, {
    data: {
      first_name: "John",
      last_name: "Doe",
      dob: "1990-01-15",
      phone: "0400000000",
      email: email,
      password: password,
      address: {
        street: "123 Test Street",
        city: "NSW",
        state: "QLD",
        country: "AU",
        postal_code: "2000",
      },
    },
  });
  expect(response.status()).toBe(201);
  return response;
}         