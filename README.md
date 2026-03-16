# Playwright Portfolio Project

A Playwright end-to-end test suite built as a personal portfolio project, 
covering core e-commerce user flows on a practice application.

## Tech Stack
- Playwright (TypeScript)
- Cross-browser: Chrome, Firefox, Safari (WebKit)
- Node.js

## What's Covered
- User signup flow
- User authentication (storageState)
- End-to-end checkout flow with multi-step validation
- API test project configuration
- Cross-browser test execution

## Key Features
- Auth state management using storageState
- CI-ready configuration (retries, parallel execution, worker config)
- Trace and video capture on failure
- data-test attribute selector strategy
- HTML reporter

## How to Run

### Install dependencies
npm install
npx playwright install

### Run all tests
npx playwright test

### Run specific browser
npx playwright test --project=chromium

### View HTML report
npx playwright show-report

## Project Structure
tests/
  auth.setup.ts        # Authentication setup
  checkout.spec.ts     # End-to-end checkout flow
  api/                 # API test specs
  lib/                 # Shared utilities
playwright.config.ts   # Global configuration
