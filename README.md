# Toolshop Playwright TypeScript
[![Playwright Tests](https://github.com/joejoubrisbane/toolshop-playwright-ts/actions/workflows/playwright.yml/badge.svg)](https://github.com/joejoubrisbane/toolshop-playwright-ts/actions/workflows/playwright.yml)

A Playwright end-to-end and API test suite built as a personal portfolio project, covering core e-commerce user flows on [practicesoftwaretesting.com](https://practicesoftwaretesting.com).

---

## Tech Stack

- **[Playwright](https://playwright.dev/)** with TypeScript — E2E and API testing
- **Node.js 24** — runtime
- **GitHub Actions** — CI/CD pipeline
- **Docker Compose** — full local stack for CI (Laravel API + Angular UI + MariaDB + Nginx)
- **dotenv** — environment variable management

---

## Project Structure

```
toolshop-playwright-ts/
├── tests/
│   ├── api/
│   │   ├── api.spec.ts          # POST /users/login
│   │   ├── brand.spec.ts        # Full CRUD: GET, POST, PUT, PATCH, DELETE /brands
│   │   └── product.spec.ts      # Dynamic product search by name → fetch by ID
│   ├── auth/
│   │   └── auth.setup.ts        # Two auth strategies: UI login + API token injection
│   └── ui/
│       ├── checkout.spec.ts     # 5 payment methods as parallel parameterised tests
│       ├── contact.spec.ts      # Contact form: register → message → reply workflow
│       └── search.spec.ts       # Search, price range filter, API response mocking
├── lib/
│   ├── datafactory/
│   │   └── register.ts          # API-based user registration factory
│   ├── fixtures/
│   │   └── pages.fixtures.ts    # Worker-scoped auth + all page object fixtures
│   ├── helpers/
│   │   ├── action.ts            # setSliderValue() — keyboard-driven slider control
│   │   ├── messages.ts          # createMessage() — API helper with auth token extraction
│   │   └── stats.ts             # randomState() — random Australian state generator
│   └── pages/
│       ├── alert.page.ts
│       ├── checkout.page.ts
│       ├── home.page.ts
│       ├── login.page.ts
│       ├── messages.page.ts
│       ├── navigation.page.ts
│       ├── product.page.ts
│       └── search.page.ts
├── .auth/                       # Persisted browser auth states (gitignored)
├── .github/workflows/
│   └── playwright.yml           # GitHub Actions CI pipeline
├── docker-compose.ci.yml        # Full stack: API + UI + MariaDB + Nginx
├── playwright.config.ts
└── tsconfig.json                # Path aliases: @pages, @fixtures, @helpers, @datafactory
```

---

## Key Patterns & Design Decisions

### Page Object Model (POM)
Eight typed page classes encapsulate all locators and interactions. Methods only perform actions — assertions stay in the test. This keeps page objects reusable and tests readable.

```typescript
// lib/pages/messages.page.ts
export class MessagesPage {
  readonly rows: Locator;
  readonly replyInput: Locator;
  readonly replyButton: Locator;

  async goto() { ... }
  async getLastRow(): Promise<Locator> { ... }
  async clickLastDetailsLink() { ... }
  async fillReply(message: string) { ... }
  async clickReplyButton() { ... }
}
```

### Custom Fixtures
All page objects are registered as Playwright fixtures in `pages.fixtures.ts`, making them available as named parameters in any test. A worker-scoped `workerUser` fixture handles authentication once per worker (see Performance section).

```typescript
test("example", async ({ messagesPage, loginPage }) => {
  await messagesPage.goto();
});
```

### Data Factory Pattern
`registerUser()` creates isolated test users via API using `Date.now()` + `Math.random()` suffixes to prevent email collisions in parallel test runs.

```typescript
const email = `customer+${Date.now()}_${Math.random().toString(36).substring(2, 7)}@...`;
```

### Network Response Interception
`page.waitForResponse()` is registered **before** the action that triggers the request — avoiding race conditions where the response arrives before the listener starts.

```typescript
// Register listener first, then trigger the action
const replyResponsePromise = page.waitForResponse(
  (r) => r.url().includes(`/messages/${messageId}/reply`) && r.request().method() === "POST"
);
await messagesPage.clickReplyButton();
const body = await (await replyResponsePromise).json();
expect(body.message).toBe(replyMessage);
```

This pattern also captures API responses for assertion — verifying both the UI interaction and the underlying API contract in a single step.

### Auth State Management
Two strategies used depending on test requirements:

1. **API token injection** (admin setup) — POST to `/users/login`, extract `access_token`, inject directly into `localStorage` via `page.evaluate()`, save `storageState`
2. **UI login with storageState** (customer setup) — full browser login flow, save resulting cookies + localStorage to `.auth/*.json`

For tests that register a fresh user per run (e.g. `contact.spec.ts`), `context.storageState({ path: authFile })` is called after login to persist the new user's token for subsequent API calls in the same test.

### API Response Mocking
`page.route()` intercepts live API calls, modifies the JSON response, and validates the UI renders the mocked data — testing both the network layer and the rendering layer together.

```typescript
await page.route(`${API_URL}/products*`, async (route) => {
  const response = await route.fetch();
  const json = await response.json();
  json.data[0]["name"] = "Modified Product Name";
  await route.fulfill({ response, json });
});
```

### Parameterised Tests
All 5 payment method tests are generated from a data array and run in parallel — one test definition covers all scenarios.

```typescript
for (const { method, setupPayment } of paymentScenarios) {
  test(`should complete checkout with ${method}`, async ({ ... }) => { ... });
}
```

---

## Performance Optimisation: Worker-Scoped Login

**Problem:** Each checkout test registered a new user and completed a full UI login before running. With 5 parallel payment tests, that meant 5 × (API register + UI login) — ~5 seconds of overhead per test.

**Solution:** A `workerUser` fixture (scoped to `"worker"`) registers one user and logs in once per Playwright worker. The resulting `storageState` is injected into every test context at creation time — tests start already authenticated.

```
Worker starts
  └── workerUser: register → UI login once → save storageState

  Test 1: newContext({ storageState }) → already logged in → run test
  Test 2: newContext({ storageState }) → already logged in → run test
  ...
```

Tests remain independent — each gets its own fresh browser context — but the login cost is paid once per worker, not once per test.

**Results (5 checkout tests, local, fully parallel):**

| Test | Before | After | Saved |
|---|---|---|---|
| Buy Now Pay Later | 20,220ms | 15,929ms | 4,291ms |
| Bank Transfer | 20,656ms | 15,426ms | 5,230ms |
| Cash on Delivery | 20,230ms | 15,330ms | 4,900ms |
| Credit Card | 20,837ms | 15,864ms | 4,973ms |
| Gift Card | 21,123ms | 15,827ms | 5,296ms |
| **Total wall time** | **43,179ms** | **39,032ms** | **~4,147ms** |

Each test saves ~5 seconds. Total wall time saving is smaller because tests run in parallel — the per-test saving is the meaningful metric, and compounds as the test suite grows.

---

## CI Pipeline

Tests run on every push and pull request via GitHub Actions. The pipeline spins up a full local stack via Docker Compose before running tests:

1. Start Docker Compose (Laravel API + Angular UI + MariaDB + Nginx)
2. Seed the database (`php artisan migrate:fresh --seed`)
3. Poll API and UI health endpoints until ready
4. Install Node 24 + dependencies + Playwright browsers (Chromium only on CI)
5. Run all tests with environment variables from GitHub Secrets
6. Upload `playwright-report/` as a build artifact (30-day retention)

CI uses `workers: 1` and `retries: 2` to ensure stability in a single-container environment.

---

## How to Run

### Install dependencies
```bash
npm install
npx playwright install
```

### Set up environment variables
Create a `.env` file in the root:
```
TEST_ADMIN_EMAIL=admin@practicesoftwaretesting.com
TEST_PASSWORD=welcome01
CUSTOMER_EMAIL=customer@practicesoftwaretesting.com
API_URL=https://api.practicesoftwaretesting.com
BASE_URL=https://practicesoftwaretesting.com
NEW_USER_PASSWORD=TestPass123!
```

### Run all tests
```bash
npx playwright test
```

### Run by project
```bash
npx playwright test --project=api        # API tests only
npx playwright test --project=chromium   # UI tests only
```

### Run a specific file
```bash
npx playwright test tests/ui/contact.spec.ts
```

### Open Playwright UI
```bash
npx playwright test --ui
```

### View HTML report
```bash
npx playwright show-report
```

---

## Test Coverage

| Area | Type | Coverage |
|---|---|---|
| User checkout — 5 payment methods (parallel) | UI E2E | ✅ Local + CI |
| Contact form — register, send message, view, reply | UI E2E | ✅ Local + CI |
| Search by keyword — result accuracy | UI E2E | ✅ Local + CI |
| Price range filter — slider + API response validation | UI E2E | ✅ Local + CI |
| API response mocking — modified data rendered in UI | UI + Network | ✅ Local + CI |
| POST /users/login | API | ✅ Local + CI |
| Full CRUD /brands (GET, POST, PUT, PATCH, DELETE) | API | ✅ Local + CI |
| Dynamic product search by name → ID chaining | API | ✅ Local + CI |
| Auth state management (storageState, token injection) | Setup | ✅ Local + CI |
