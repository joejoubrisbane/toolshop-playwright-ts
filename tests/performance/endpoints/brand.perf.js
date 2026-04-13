import http from 'k6/http';
import { check, group } from 'k6';

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

function buildHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/users/login`,
    JSON.stringify({
      email: __ENV.TEST_ADMIN_EMAIL || 'admin@practicesoftwaretesting.com',
      password: __ENV.TEST_PASSWORD || 'welcome01',
    }),
    { headers: buildHeaders() }
  );

  if (loginRes.status !== 200) {
    throw new Error(`Admin login failed: ${loginRes.status} ${loginRes.body}`);
  }

  return { token: loginRes.json().access_token };
}

export default function (data) {
  const { token } = data;
  const RUN_ID = `${Date.now()}vu${__VU}iter${__ITER}`;
  let brandId;

  group('GET /brands', () => {
    const res = http.get(
      `${BASE_URL}/brands`,
      { tags: { name: 'list_brands' } }
    );

    check(res, {
      'list brands: status 200': (r) => r.status === 200,
      'list brands: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
      'list brands: has id field': (r) => !!(r.json())[0] && !!(r.json())[0].id,
    });
  });

  group('POST /brands', () => {
    const res = http.post(
      `${BASE_URL}/brands`,
      JSON.stringify({ name: `${RUN_ID}-brand`, slug: `${RUN_ID}-slug` }),
      { headers: buildHeaders(token), tags: { name: 'create_brand' } }
    );

    check(res, {
      'create brand: status 201': (r) => r.status === 201,
      'create brand: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
      'create brand: id exists': (r) => !!(r.json()).id,
    });

    brandId = res.json().id;
  });

  group('GET /brands/{id}', () => {
    const res = http.get(
      `${BASE_URL}/brands/${brandId}`,
      { tags: { name: 'get_brand' } }
    );

    check(res, {
      'get brand: status 200': (r) => r.status === 200,
      'get brand: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
    });
  });

  group('PUT /brands/{id}', () => {
    const res = http.put(
      `${BASE_URL}/brands/${brandId}`,
      JSON.stringify({ name: `${RUN_ID}-updated`, slug: `${RUN_ID}-updated-slug` }),
      { headers: buildHeaders(token), tags: { name: 'update_brand' } }
    );

    check(res, {
      'update brand: status 200': (r) => r.status === 200,
      'update brand: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
    });
  });

  group('PATCH /brands/{id}', () => {
    const res = http.patch(
      `${BASE_URL}/brands/${brandId}`,
      JSON.stringify({ name: `${RUN_ID}-patched` }),
      { headers: buildHeaders(token), tags: { name: 'patch_brand' } }
    );

    check(res, {
      'patch brand: status 200': (r) => r.status === 200,
      'patch brand: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
    });
  });

  group('DELETE /brands/{id}', () => {
    const res = http.del(
      `${BASE_URL}/brands/${brandId}`,
      undefined,
      { headers: buildHeaders(token), tags: { name: 'delete_brand' } }
    );

    check(res, {
      'delete brand: status 204': (r) => r.status === 204,
      'delete brand: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
    });
  });
}
