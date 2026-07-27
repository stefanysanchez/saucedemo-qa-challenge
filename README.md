# SauceDemo QA Automation Framework

[![Playwright Tests](https://github.com/stefanysanchez/saucedemo-qa-challenge/actions/workflows/playwright.yml/badge.svg)](https://github.com/stefanysanchez/saucedemo-qa-challenge/actions/workflows/playwright.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Playwright](https://img.shields.io/badge/Playwright-latest-green)

End-to-end automation framework for the **SauceDemo** e-commerce demo, built with **Playwright + TypeScript** following the **Page Object Model (POM)** pattern, with enriched reporting via **Allure**, **AI integration (Google Gemini)** for data generation and results analysis, and a **CI/CD pipeline on GitHub Actions**.

## Why this project exists

It solves three concrete quality pains in e-commerce: bugs reaching production, slow manual regressions, and lack of confidence when shipping a release. The suite covers the critical purchase flow, negative authentication scenarios, and multi-user validation, with automatic evidence (screenshots, video, trace) on any failure.

## Tech stack

| Tool | Use |
|---|---|
| Playwright + TypeScript | Automation engine and language |
| Page Object Model | Architecture, layer separation |
| Allure Report | Navigable evidence report |
| Google Gemini API | Data generation + AI executive summary |
| GitHub Actions | CI/CD |

## Project structure

```
src/
├── pages/       Page Objects (no asserts)
├── fixtures/    Automatic Page Object injection
├── data/        Typed test data
├── types/       Shared interfaces
tests/e2e/
├── login.spec.ts               Negative login scenarios
├── data-driven.spec.ts         Login iterating over multiple users
├── purchase.spec.ts            Full happy-path purchase flow
├── api-smoke.spec.ts           HTTP smoke test (no browser)
├── network-resilience.spec.ts  Resilience against image load failures
├── visual-regression.spec.ts   Visual regression on inventory (toHaveScreenshot)
└── report-showcase.spec.ts     Demo suite (@demo), excluded from the CI gate
ai-scripts/      AI scripts (data generation + results analysis)
.github/workflows/  CI pipeline
```

## Quickstart

Install dependencies:
```bash
npm install
npx playwright install --with-deps chromium
```

Run the full suite:
```bash
npx playwright test
```

View the native Playwright HTML report:
```bash
npx playwright show-report
```

Generate and open the Allure report:
```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

## AI scripts

They require a GEMINI_API_KEY in a .env file at the project root (see .env.example).

Generate dynamic checkout data:
```bash
npx tsx ai-scripts/generate-test-data.ts
```

Generate a natural-language executive summary from the latest test run:
```bash
npx tsx ai-scripts/analyze-report.ts
```

## Test coverage

| Suite | Tests | What it validates |
|---|---|---|
| login.spec.ts | 3 | Negative scenarios: locked-out user, invalid password, empty fields |
| data-driven.spec.ts | 3 | Login iterating over standard_user, problem_user, performance_glitch_user |
| purchase.spec.ts | 1 | Full happy path: login → cart → checkout → confirmation |
| api-smoke.spec.ts | 3 | HTTP-level smoke test (no browser): site availability, response time, static assets |
| network-resilience.spec.ts | 2 | The purchase happy path and the inventory page keep working even when product images fail to load (page.route) |
| visual-regression.spec.ts | 1 | Visual regression on the inventory page against a versioned baseline (toHaveScreenshot) |
| report-showcase.spec.ts (@demo) | 3 | Demo suite to showcase passed/failed/skipped states in Allure |

**Total: 16 tests.** Of those, **12 run in the CI gate** (`npm run test:ci`); the other 4 are intentionally excluded: the 3 in `report-showcase.spec.ts` (tag `@demo`, demo-only) and the one in `visual-regression.spec.ts` (its baseline is platform-specific — see the CI/CD section).

## CI/CD

Every push to main triggers the GitHub Actions workflow: it installs dependencies, runs `npm run test:ci`, and publishes the Playwright report and Allure results as artifacts. Failure evidence (trace/video/screenshot) is uploaded only if a test fails.

`test:ci` runs `playwright test --grep-invert "@demo|Visual regression"`, excluding both the demo suite (`@demo`) and `visual-regression.spec.ts`. The latter is excluded because its baseline (`inventory-standard-user-*.png`) was generated on local Windows; the CI runner is Linux (`ubuntu-latest`), so running it there would fail due to a missing snapshot, not an actual regression. To run it manually on its own:
```bash
npm run test:visual
```

## Architecture decisions

- **POM with strict layer separation**: Page Objects (`src/pages/`) contain no asserts, only interactions and state reading; assertions live in the specs.
- **Fixtures for automatic injection** (`src/fixtures/pages.fixture.ts`): every test receives `loginPage`, `inventoryPage`, `cartPage`, `checkoutPage` already instantiated, with no manual construction boilerplate.
- **Chromium only at this stage**: a deliberate time/scope trade-off; cross-browser (Firefox, WebKit) is left as the next iteration, not an oversight.
- **AI scoped to two concrete use cases** (checkout data generation and natural-language results analysis), never to generate or decide which tests to run — AI plays no role in the testing logic itself.
- **AI provider: Google Gemini**, free tier. A choice with no architectural impact: it's a direct HTTP call to the public API, replaceable with any other provider without touching the rest of the framework.
- **API coverage via HTTP smoke + network resilience**, instead of mocking a login endpoint that SauceDemo doesn't expose (login is validated 100% client-side against a hardcoded array in the bundle).
- **Visual regression on `standard_user`**, not `problem_user`: the latter has intentionally broken product images (a bug seeded by SauceDemo), which would make the baseline non-deterministic.
