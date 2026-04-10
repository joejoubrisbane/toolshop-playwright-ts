import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.API_URL || 'http://localhost:8091';
const MAX_DURATION_MS = 200;
export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.1'],    // <10% errors
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
  },
};

function buildHeaders(token?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export function setup(): { token: string; email: string; userId: string } {
  const email = `customer+${Date.now()}@practicesoftwaretesting.com`;
  const password = __ENV.NEW_USER_PASSWORD || 'Test0806449!!';

  const registerRes = http.post(
    `${BASE_URL}/users/register`,
    JSON.stringify({
      first_name: 'K6',
      last_name: 'Smoke',
      dob: '1990-01-15',
      phone: '0400000000',
      email,
      password,
      address: {
        street: '123 Test Street',
        city: 'NSW',
        state: 'QLD',
        country: 'AU',
        postal_code: '2000',
      },
    }),
    { headers: buildHeaders() }
  );

  check(registerRes, {
    'register: status 201': (r) => r.status === 201,
    'register: id exists': (r) => !!(r.json() as any)?.id,
  });

  if (registerRes.status !== 201) {
    throw new Error(`Registration failed: ${registerRes.status} ${registerRes.body}`);
  }

  const userId = (registerRes.json() as any).id as string;

  const loginRes = http.post(
    `${BASE_URL}/users/login`,
    JSON.stringify({ email, password }),
    { headers: buildHeaders() }
  );

  check(loginRes, {
    'login: status 200': (r) => r.status === 200,
    'login: access_token exists': (r) => !!(r.json() as any)?.access_token,
  });

  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${loginRes.status} ${loginRes.body}`);
  }

  const token = (loginRes.json() as any).access_token as string;

  return { token, email, userId };
}

export default function (data: { token: string; email: string; userId: string }) {
  const { token } = data;
  let productId: string;
  let cartId: string;
  let invoiceId: string;

  group('Browse products', () => {
    const searchRes = http.get(
      `${BASE_URL}/products/search?q=Combination+Pliers`,
      { headers: buildHeaders() }
    );

    check(searchRes, {
      'search: status 200': (r) => r.status === 200,
      'search: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
      'search: first product id exists': (r) => !!(r.json() as any)?.data?.[0]?.id,
    });

    productId = (searchRes.json() as any).data[0].id as string;

    const productRes = http.get(
      `${BASE_URL}/products/${productId}`,
      { headers: buildHeaders() }
    );

    check(productRes, {
      'product: status 200': (r) => r.status === 200,
      'product: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
      'product: name is Combination Pliers': (r) => (r.json() as any)?.name === 'Combination Pliers',
    });
  });

  group('Add to cart', () => {
    const createCartRes = http.post(
      `${BASE_URL}/carts`,
      JSON.stringify({}),
      { headers: buildHeaders(token) }
    );

    check(createCartRes, {
      'create cart: status 201': (r) => r.status === 201,
      'create cart: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
      'create cart: id exists': (r) => !!(r.json() as any)?.id,
    });

    cartId = (createCartRes.json() as any).id as string;

    const addItemRes = http.post(
      `${BASE_URL}/carts/${cartId}`,
      JSON.stringify({ product_id: productId, quantity: 1 }),
      { headers: buildHeaders(token) }
    );

    check(addItemRes, {
      'add item: status 200': (r) => r.status === 200,
      'add item: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
    });
  });

  group('Checkout', () => {
    const invoiceRes = http.post(
      `${BASE_URL}/invoices`,
      JSON.stringify({
        billing_street: '123 Test Street',
        billing_city: 'Brisbane',
        billing_state: 'QLD',
        billing_country: 'AU',
        billing_postal_code: '4000',
        payment_method: 'bank-transfer',
        cart_id: cartId,
        payment_details: {
    bank_name: "commonwealth",
    account_name: "test user",
    account_number: "123456789"
  }
      }),
      { headers: buildHeaders(token) }
    );

    check(invoiceRes, {
      'create invoice: status 201': (r) => r.status === 201,
      'create invoice: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
      'create invoice: id exists': (r) => !!(r.json() as any)?.id,
    });
    
    invoiceId = (invoiceRes.json() as any).id as string;

    const getInvoiceRes = http.get(
      `${BASE_URL}/invoices/${invoiceId}`,
      { headers: buildHeaders(token) }
    );

    check(getInvoiceRes, {
      'get invoice: status 200': (r) => r.status === 200,
      'get invoice: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
    });
  });

  // Cleanup — delete cart within default() where cartId is in scope
  // Each VU cleans up its own cart independently — scales to any VU count
  group('Cleanup', () => {
    const delCartRes = http.del(
      `${BASE_URL}/carts/${cartId}`,
      undefined,
      {
        headers: buildHeaders(token),
        responseCallback: http.expectedStatuses(200, 204, 404),
      }
    );

    check(delCartRes, {
      'cleanup: cart deleted': (r) => r.status === 200 || r.status === 204,
    });

    console.log(`Deleted cart ${cartId}: status ${delCartRes.status}`);
  });
}

// teardown() intentionally omitted:
// - DELETE /invoices returns 405 (not supported by this API)
// - DELETE /users returns 409 (invoice holds FK reference, cannot remove user)
// - Cart is cleaned up inside default() where cartId is in scope
// - Docker container resets between CI runs — leftover users are irrelevant
// - In a persistent environment, use a DB cleanup script outside k6
