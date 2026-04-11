import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.API_URL || 'http://localhost:8091';
const MAX_DURATION_MS = 500;

export const options = {
  vus: 3,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<500'],
  },
};

export function setup() {
  const res = http.get(`${BASE_URL}/products`);
  if (res.status !== 200) {
    throw new Error(`API server is not reachable: ${BASE_URL}/products returned ${res.status}`);
  }
}

export default function () {
  group('GET /products', () => {
    const res = http.get(
      `${BASE_URL}/products`,
      { tags: { name: 'list_products' } }
    );

    check(res, {
      'list products: status 200': (r) => r.status === 200,
      'list products: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
    });
  });

  group('GET /products/search', () => {
    const res = http.get(
      `${BASE_URL}/products/search?q=Combination+Pliers`,
      { tags: { name: 'search_products' } }
    );

    check(res, {
      'search products: status 200': (r) => r.status === 200,
      'search products: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
      'search products: has results': (r) => !!(r.json() as any)?.data?.[0]?.id,
    });

    const productId = (res.json() as any)?.data?.[0]?.id as string;
    if (!productId) return;

    group('GET /products/{id}', () => {
      const productRes = http.get(
        `${BASE_URL}/products/${productId}`,
        { tags: { name: 'get_product' } }
      );

      check(productRes, {
        'get product: status 200': (r) => r.status === 200,
        'get product: response time ok': (r) => r.timings.duration < MAX_DURATION_MS,
        'get product: name exists': (r) => !!(r.json() as any)?.name,
      });
    });
  });
}
