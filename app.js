import {
  calculateMortgageDetails,
  roundCurrency,
  sampleScenarios,
} from "./calculator.js";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-GB", {
  style: "percent",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
});

const form = document.querySelector("#mortgage-form");
const message = document.querySelector("#form-message");
const scenarioSelect = document.querySelector("#scenario");
const mortgageType = document.querySelector("#mortgageType");
const propertyValue = document.querySelector("#propertyValue");
const downPayment = document.querySelector("#downPayment");
const loanAmount = document.querySelector("#loanAmount");
const interestRate = document.querySelector("#interestRate");
const loanTerm = document.querySelector("#loanTerm");
const extraPayment = document.querySelector("#extraPayment");
const resetButton = document.querySelector("#reset-button");

const monthlyPayment = document.querySelector("#monthlyPayment");
const totalInterest = document.querySelector("#totalInterest");
const totalPaid = document.querySelector("#totalPaid");
const ltv = document.querySelector("#ltv");
const payoffDate = document.querySelector("#payoffDate");
const rateNote = document.querySelector("#rate-note");
const basePayment = document.querySelector("#basePayment");
const extraPaymentSummary = document.querySelector("#extraPaymentSummary");
const loanSummary = document.querySelector("#loanSummary");
const depositRatio = document.querySelector("#depositRatio");
const termSummary = document.querySelector("#termSummary");
const amortizationBody = document.querySelector("#amortizationBody");

const defaultValues = {
  propertyValue: 325000,
  downPayment: 65000,
  loanAmount: 260000,
  interestRate: 4.1,
  loanTerm: 25,
  mortgageType: "repayment",
  extraPayment: 0,
};

function formatCurrency(value, withPennies = false) {
  return withPennies
    ? compactCurrencyFormatter.format(value)
    : currencyFormatter.format(value);
}

function fillScenarioOptions() {
  for (const scenario of sampleScenarios) {
    const option = document.createElement("option");
    option.value = scenario.name;
    option.textContent = scenario.name;
    scenarioSelect.append(option);
  }
}

function fillForm(values) {
  propertyValue.value = values.propertyValue;
  downPayment.value = values.downPayment;
  loanAmount.value = values.loanAmount;
  interestRate.value = values.interestRate;
  loanTerm.value = values.loanTerm;
  mortgageType.value = values.mortgageType;
  extraPayment.value = values.extraPayment;
}

function getFormValues() {
  return {
    propertyValue: Number(propertyValue.value),
    downPayment: Number(downPayment.value),
    loanAmount: Number(loanAmount.value),
    interestRate: Number(interestRate.value),
    loanTerm: Number(loanTerm.value),
    mortgageType: mortgageType.value,
    extraPayment: Number(extraPayment.value),
  };
}

function syncLoanAmountFromDeposit() {
  const property = Number(propertyValue.value);
  const deposit = Number(downPayment.value);
  if (property > 0 && deposit >= 0) {
    loanAmount.value = roundCurrency(Math.max(0, property - deposit));
  }
}

function syncDepositFromLoanAmount() {
  const property = Number(propertyValue.value);
  const loan = Number(loanAmount.value);
  if (property > 0 && loan >= 0) {
    downPayment.value = roundCurrency(Math.max(0, property - loan));
  }
}

function renderAmortization(schedule) {
  amortizationBody.innerHTML = "";

  for (const row of schedule) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.month}</td>
      <td>${formatCurrency(row.principal)}</td>
      <td>${formatCurrency(row.interest)}</td>
      <td>${formatCurrency(row.balance)}</td>
    `;
    amortizationBody.append(tr);
  }
}

function renderResults(result, values) {
  monthlyPayment.value = formatCurrency(result.monthlyPayment);
  totalInterest.textContent = formatCurrency(result.totalInterest);
  totalPaid.textContent = formatCurrency(result.totalPaid);
  ltv.textContent = percentFormatter.format(result.ltv / 100);
  payoffDate.textContent = dateFormatter.format(result.payoffDate);
  basePayment.textContent = formatCurrency(result.basePayment, true);
  extraPaymentSummary.textContent = formatCurrency(values.extraPayment, true);
  loanSummary.textContent = formatCurrency(values.loanAmount);
  depositRatio.textContent = percentFormatter.format(result.depositRatio / 100);
  termSummary.textContent = `${result.monthsElapsed} months`;
  renderAmortization(result.schedule);

  if (values.mortgageType === "adjustable") {
    rateNote.textContent =
      "Uses the current rate as an estimate. Adjustable repayments can change later.";
  } else if (values.mortgageType === "interestOnly") {
    rateNote.textContent =
      "Interest-only estimates exclude a separate repayment strategy for the principal balance.";
  } else {
    rateNote.textContent = "Repayment estimate includes principal and interest.";
  }
}

function calculateAndRender() {
  const values = getFormValues();
  const result = calculateMortgageDetails(values);

  if (result.errors.length) {
    message.textContent = result.errors[0];
    return;
  }

  message.textContent = "";
  renderResults(result, values);
}

scenarioSelect.addEventListener("change", () => {
  const scenario = sampleScenarios.find(({ name }) => name === scenarioSelect.value);
  if (!scenario) {
    fillForm(defaultValues);
    calculateAndRender();
    return;
  }

  fillForm({
    propertyValue: scenario.propertyValue,
    downPayment: roundCurrency(scenario.propertyValue - scenario.loanAmount),
    loanAmount: scenario.loanAmount,
    interestRate: scenario.interestRate,
    loanTerm: scenario.loanTerm,
    mortgageType: scenario.mortgageType,
    extraPayment: 0,
  });
  calculateAndRender();
});

propertyValue.addEventListener("input", syncLoanAmountFromDeposit);
downPayment.addEventListener("input", syncLoanAmountFromDeposit);
loanAmount.addEventListener("input", syncDepositFromLoanAmount);

mortgageType.addEventListener("change", () => {
  if (mortgageType.value === "interestOnly") {
    extraPayment.value = 0;
    extraPayment.setAttribute("disabled", "disabled");
  } else {
    extraPayment.removeAttribute("disabled");
  }
  calculateAndRender();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculateAndRender();
});

resetButton.addEventListener("click", () => {
  scenarioSelect.value = "";
  fillForm(defaultValues);
  extraPayment.removeAttribute("disabled");
  message.textContent = "";
  calculateAndRender();
});

fillScenarioOptions();
fillForm(defaultValues);
calculateAndRender();
