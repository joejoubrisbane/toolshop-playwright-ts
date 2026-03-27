# Toolshop Playwright TypeScript
[![Playwright Tests](https://github.com/joejoubrisbane/toolshop-playwright-ts/actions/workflows/playwright.yml/badge.svg)](https://github.com/joejoubrisbane/toolshop-playwright-ts/actions/workflows/playwright.yml)
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
    checkout.spec.ts     # Parallel checkout flows across 5 payment methods
  contact/
    contact.spec.ts      # Contact form submission flow
  ui/
    search.spec.ts       # Search, price range filter, and API mocking tests
lib/
  datafactory/
    register.ts          # API-based user registration with dynamic test data
  fixtures/
    pages.fixtures.ts    # Custom test fixtures composing all page objects
  helpers/
    action.ts            # Reusable UI actions (e.g. setSliderValue)
    arrays.ts            # Array utility helpers
    messages.ts          # Shared message constants
    stats.ts             # Random data helpers (e.g. randomState)
  pages/
    alert.page.ts        # Alert/notification page object
    checkout.page.ts     # Checkout page object (billing, payment, confirmation)
    home.page.ts         # Homepage page object
    login.page.ts        # Login page object
    navigation.page.ts   # Navigation/header page object
    product.page.ts      # Product detail page object
    search.page.ts       # Search page object (search input, filters, price slider)
scripts/
  inspect-slider.js      # One-off script to inspect DOM elements in the browser
playwright.config.ts     # Global configuration
.github/workflows/
  playwright.yml         # GitHub Actions CI pipeline
```

## Key Features

- **Page Object Model (POM)** — Typed page classes covering login, home, search, product, checkout, alert, and navigation
- **Custom fixtures** — `pages.fixtures.ts` composes all page objects into a single reusable fixture
- **Data Factory pattern** — `registerUser()` generates unique test users via API using `Date.now()` for isolated test runs
- **Parallel checkout coverage** — 5 payment methods (Buy Now Pay Later, Bank Transfer, Cash on Delivery, Credit Card, Gift Card) run as parallel parameterised tests
- **Dual auth strategies** — UI-based login with storageState, and API token injection into localStorage
- **API testing** — REST endpoint validation including chained requests (search by name → fetch by dynamic ID)
- **Network interception** — `page.route()` used to modify live API responses and assert UI renders mocked data correctly
- **Price range filter testing** — ngx-slider interaction via keyboard with `setSliderValue()` helper, validated against intercepted API response
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
| User checkout — 5 payment methods (parallel) | UI E2E | ✅ Local |
| Contact form submission | UI E2E | ✅ Local |
| Search by keyword — result accuracy | UI E2E | ✅ Local |
| Price range filter — slider + API response validation | UI E2E | ✅ Local |
| API response mocking — modified product data rendered in UI | UI + Network | ✅ Local |
| User registration | API | ✅ Local + CI |
| GET /products | API | ✅ Local + CI |
| POST /users/login | API | ✅ Local + CI |
| Dynamic product search by name → ID | API | ✅ Local + CI |
| Auth state management (storageState) | Setup | ✅ Local |