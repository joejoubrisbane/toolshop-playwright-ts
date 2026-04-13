import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.API_URL || 'http://localhost:8091';
const MAX_DURATION_MS = 500;

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<500'],
  },
};

const RUN_ID = Date.now();

function buildHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export default function () {
  const email = `customer+${RUN_ID}vu${__VU}iter${__ITER}@practicesoftwaretesting.com`;
  const password = __ENV.NEW_USER_PASSWORD || 'Test0806449!!';
  let productId;
  let cartId;
  let invoiceId;

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
    { headers: buildHeaders(undefined), tags: { name: 'register' } },
  );

  check(registerRes, {
    'register: status 201': (r) => r.status === 201,
    'register: id exists': (r) => !!(r.json()).id,
  });

  if (registerRes.status !== 201) {
    throw new Error(`Registration failed: ${registerRes.status} ${registerRes.body}`);
  }

  sleep(1);

  const loginRes = http.post(
    `${BASE_URL}/users/login`,
    JSON.stringify({ email, password }),
    { headers: buildHeaders(undefined), tags: { name: 'login' } }
  );

  check(loginRes, {
    'login: status 200': (r) => r.status === 200,
    'login: access_token exists': (r) => !!(r.json()).access_token,
  });

  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${loginRes.status} ${loginRes.body}`);
  }

  const token = loginRes.json().access_token;

  sleep(2);

  group('Browse products', () => {
    const searchRes = http.get(
      `${BASE_URL}/products/search?q=Combination+Pliers`,
      { headers: buildHeaders(undefined), tags: { name: 'search' } }
    );

    check(searchRes, {
      'search: status 200': (r) => r.status === 200,
      'search: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
      'search: first product id exists': (r) => !!(r.json()).data && !!(r.json()).data[0] && !!(r.json()).data[0].id,
    });

    sleep(2);

    const searchData = searchRes.json();
    productId = searchData.data[0].id;

    const productRes = http.get(
      `${BASE_URL}/products/${productId}`,
      { headers: buildHeaders(undefined), tags: { name: 'get_product' } }
    );

    check(productRes, {
      'product: status 200': (r) => r.status === 200,
      'product: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
      'product: name is Combination Pliers': (r) => r.json().name === 'Combination Pliers',
    });

    sleep(3);
  });

  group('Add to cart', () => {
    const createCartRes = http.post(
      `${BASE_URL}/carts`,
      JSON.stringify({}),
      { headers: buildHeaders(token), tags: { name: 'create_cart' } }
    );

    check(createCartRes, {
      'create cart: status 201': (r) => r.status === 201,
      'create cart: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
      'create cart: id exists': (r) => !!(r.json()).id,
    });

    cartId = createCartRes.json().id;

    const addItemRes = http.post(
      `${BASE_URL}/carts/${cartId}`,
      JSON.stringify({ product_id: productId, quantity: 1 }),
      { headers: buildHeaders(token), tags: { name: 'add_item' } }
    );

    check(addItemRes, {
      'add item: status 200': (r) => r.status === 200,
      'add item: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
    });

    sleep(2);
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
          bank_name: 'commonwealth',
          account_name: 'test user',
          account_number: '123456789',
        },
      }),
      { headers: buildHeaders(token), tags: { name: 'create_invoice' } }
    );

    check(invoiceRes, {
      'create invoice: status 201': (r) => r.status === 201,
      'create invoice: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
      'create invoice: id exists': (r) => !!(r.json()).id,
    });

    invoiceId = invoiceRes.json().id;

    const getInvoiceRes = http.get(
      `${BASE_URL}/invoices/${invoiceId}`,
      { headers: buildHeaders(token), tags: { name: 'get_invoice' } }
    );

    check(getInvoiceRes, {
      'get invoice: status 200': (r) => r.status === 200,
      'get invoice: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
    });

    sleep(2);
  });
}
