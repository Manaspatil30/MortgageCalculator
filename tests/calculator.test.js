import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateMortgageDetails,
  calculateMonthlyPayment,
  sampleScenarios,
} from "../calculator.js";

test("repayment formula matches a known baseline", () => {
  const payment = calculateMonthlyPayment({
    loanAmount: 150000,
    interestRate: 3.5,
    totalMonths: 25 * 12,
    mortgageType: "repayment",
  });

  assert.ok(Math.abs(payment - 750.94) < 0.02);
});

test("sample scenarios return valid estimates", () => {
  for (const scenario of sampleScenarios) {
    const propertyValue = scenario.propertyValue;
    const downPayment = propertyValue - scenario.loanAmount;
    const result = calculateMortgageDetails({
      ...scenario,
      downPayment,
      extraPayment: 0,
    });

    assert.deepEqual(result.errors, []);
    assert.ok(result.monthlyPayment > 0);
    assert.ok(result.totalPaid >= scenario.loanAmount);
  }
});

test("extra payments shorten repayment mortgages", () => {
  const withoutExtra = calculateMortgageDetails({
    propertyValue: 300000,
    downPayment: 60000,
    loanAmount: 240000,
    interestRate: 4.4,
    loanTerm: 30,
    mortgageType: "repayment",
    extraPayment: 0,
  });

  const withExtra = calculateMortgageDetails({
    propertyValue: 300000,
    downPayment: 60000,
    loanAmount: 240000,
    interestRate: 4.4,
    loanTerm: 30,
    mortgageType: "repayment",
    extraPayment: 200,
  });

  assert.ok(withExtra.monthsElapsed < withoutExtra.monthsElapsed);
  assert.ok(withExtra.totalInterest < withoutExtra.totalInterest);
});

test("interest-only mortgages keep the original balance until maturity", () => {
  const result = calculateMortgageDetails({
    propertyValue: 312500,
    downPayment: 62500,
    loanAmount: 250000,
    interestRate: 4,
    loanTerm: 25,
    mortgageType: "interestOnly",
    extraPayment: 0,
  });

  assert.equal(result.schedule[0].principal, 0);
  assert.equal(result.schedule[0].interest, 833.33);
  assert.equal(result.monthsElapsed, 300);
});
