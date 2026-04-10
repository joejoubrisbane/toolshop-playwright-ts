import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8091';

export function setup() {
  const res = http.get(`${BASE_URL}/products`);
  if (res.status !== 200) {
    throw new Error(`API server is not reachable: ${__ENV.API_URL}/products returned ${res.status}`);
  }
}

export default function () {
  const res = http.get(`${BASE_URL}/products`);
  check(res, {
    'status was 200': (r) => r.status == 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
}