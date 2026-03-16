# Mortgage Calculator

A responsive mortgage calculator built as a static web app with accessible form controls, reusable calculation logic, and automated tests based on the supplied sample scenarios.

## Features

- Responsive single-page interface for desktop and mobile
- Repayment, adjustable-rate estimate, and interest-only modes
- Loan-to-value, deposit ratio, payoff timing, and first-year amortization view
- Sample scenarios derived from `mortgage_calculator_sample_data.xlsx`
- Zero-dependency local development and Node-based test coverage

## Run locally

1. Install nothing extra: Node.js 22 is enough.
2. Start the local server:

```bash
npm start
```

3. Open `http://localhost:3000`.

## Test

```bash
npm test
```
Set the startup command to `npm start` and ensure the `PORT` app setting is available.

## Testing checklist

- Functional: verify monthly payment, total interest, and payoff timing for each sample scenario
- Usability: test mobile layout, keyboard navigation, focus states, and error messaging
- Performance: confirm fast first render and no blocking dependencies
- Regression: run `npm test` before each deployment
