# Toolshop Playwright TypeScript

A Playwright end-to-end and API test suite built as a personal portfolio project,
covering core e-commerce user flows on [practicesoftwaretesting.com](https://practicesoftwaretesting.com).

## Tech Stack

- [Playwright](https://playwright.dev/) with TypeScript
- Cross-browser: Chromium, Firefox, WebKit (Safari)
- Node.js
- GitHub Actions CI

## Project Structure
```
tests/
  api/
    api.spec.ts          # GET /products, POST /users/login
    product.spec.ts      # Dynamic product search and retrieval
  auth/
    auth.setup.ts        # Auth state setup (UI login + API token strategies)
  checkout/
    checkout.spec.ts     # End-to-end checkout flow with multi-step assertions
lib/
  datafactory/
    register.ts          # API-based user registration with dynamic test data
  page/
    login.page.ts        # Page Object Model for login page
playwright.config.ts     # Global configuration
.github/workflows/
  playwright.yml         # GitHub Actions CI pipeline
```

## Key Features

- **Page Object Model (POM)** — `LoginPage` class with typed Locators for
  maintainable UI interactions
- **Data Factory pattern** — `registerUser()` generates unique test users
  via API using `Date.now()` for isolated test runs
- **Dual auth strategies** — UI-based login with storageState, and API token
  injection into localStorage
- **API testing** — REST endpoint validation including chained requests
  (search by name → fetch by dynamic ID)
- **Cross-browser configuration** — Chromium, Firefox, and WebKit projects
- **CI-ready setup** — retries, parallel execution, single worker on CI
- **Trace and video capture** on test failure for debugging
- **Environment variable management** via dotenv with GitHub Secrets in CI

## CI Pipeline

API tests run automatically on every push and pull request via GitHub Actions.

UI tests are designed to run locally. The practice site uses Cloudflare bot
detection which blocks headless browsers on CI runners — a known limitation
of public practice sites that does not apply to real internal test environments.

## How to Run

### Install dependencies
```bash
npm install
npx playwright install
```

### Set up environment variables
Create a `.env` file in the root directory:
```
TEST_ADMIN_EMAIL=admin@practicesoftwaretesting.com
TEST_PASSWORD=welcome01
CUSTOMER_EMAIL=customer@practicesoftwaretesting.com
API_URL=https://api.practicesoftwaretesting.com
NEW_USER_PASSWORD=TestPass123!
```

### Run all tests
```bash
npx playwright test
```

### Run API tests only
```bash
npx playwright test --project=api
```

### Run a specific browser
```bash
npx playwright test --project=chromium
```

### View HTML report
```bash
npx playwright show-report
```

## Test Coverage

| Area | Type | Status |
|---|---|---|
| User checkout (add to cart → payment) | UI E2E | ✅ Local |
| User registration | API | ✅ Local + CI |
| GET /products | API | ✅ Local + CI |
| POST /users/login | API | ✅ Local + CI |
| Dynamic product search by name → ID | API | ✅ Local + CI |
| Auth state management (storageState) | Setup | ✅ Local |