const MONTHS_IN_YEAR = 12;

export const sampleScenarios = [
  {
    name: "Basic Mortgage",
    loanAmount: 150000,
    interestRate: 3.5,
    loanTerm: 25,
    mortgageType: "repayment",
    propertyValue: 200000,
  },
  {
    name: "Large Loan Amount",
    loanAmount: 500000,
    interestRate: 4.2,
    loanTerm: 30,
    mortgageType: "adjustable",
    propertyValue: 625000,
  },
  {
    name: "Shorter Term Loan",
    loanAmount: 200000,
    interestRate: 3,
    loanTerm: 15,
    mortgageType: "repayment",
    propertyValue: 250000,
  },
  {
    name: "High Interest Rate",
    loanAmount: 120000,
    interestRate: 5.5,
    loanTerm: 20,
    mortgageType: "repayment",
    propertyValue: 150000,
  },
  {
    name: "Low Loan Amount, Adjustable Rate",
    loanAmount: 75000,
    interestRate: 2.8,
    loanTerm: 10,
    mortgageType: "adjustable",
    propertyValue: 93750,
  },
  {
    name: "Interest-Only Mortgage",
    loanAmount: 250000,
    interestRate: 4,
    loanTerm: 25,
    mortgageType: "interestOnly",
    propertyValue: 312500,
  },
  {
    name: "High Loan-to-Value (LTV) Ratio",
    loanAmount: 350000,
    interestRate: 4.5,
    loanTerm: 30,
    mortgageType: "repayment",
    propertyValue: 400000,
  },
];

export function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getMonthlyRate(annualRate) {
  return annualRate / 100 / MONTHS_IN_YEAR;
}

export function calculateMonthlyPayment({
  loanAmount,
  interestRate,
  totalMonths,
  mortgageType,
}) {
  const monthlyRate = getMonthlyRate(interestRate);

  if (mortgageType === "interestOnly") {
    return monthlyRate === 0
      ? loanAmount / totalMonths
      : loanAmount * monthlyRate;
  }

  if (monthlyRate === 0) {
    return loanAmount / totalMonths;
  }

  const factor = (1 + monthlyRate) ** totalMonths;
  return loanAmount * ((monthlyRate * factor) / (factor - 1));
}

export function validateInputs(input) {
  const errors = [];

  if (input.propertyValue <= 0) {
    errors.push("Property value must be greater than 0.");
  }

  if (input.loanAmount <= 0) {
    errors.push("Loan amount must be greater than 0.");
  }

  if (input.loanTerm <= 0) {
    errors.push("Loan term must be greater than 0.");
  }

  if (input.interestRate < 0) {
    errors.push("Interest rate cannot be negative.");
  }

  if (input.downPayment < 0) {
    errors.push("Deposit cannot be negative.");
  }

  if (input.downPayment >= input.propertyValue) {
    errors.push("Deposit must be less than the property value.");
  }

  if (input.loanAmount > input.propertyValue) {
    errors.push("Loan amount cannot exceed the property value.");
  }

  const expectedLoan = roundCurrency(input.propertyValue - input.downPayment);
  if (Math.abs(expectedLoan - input.loanAmount) > 1) {
    errors.push("Loan amount should equal property value minus deposit.");
  }

  return errors;
}

export function buildAmortizationSchedule(input, monthsToShow = 12) {
  const totalMonths = input.loanTerm * MONTHS_IN_YEAR;
  const basePayment = calculateMonthlyPayment({
    loanAmount: input.loanAmount,
    interestRate: input.interestRate,
    totalMonths,
    mortgageType: input.mortgageType,
  });
  const extraPayment = input.mortgageType === "interestOnly" ? 0 : input.extraPayment;
  const regularPayment = basePayment + extraPayment;
  const monthlyRate = getMonthlyRate(input.interestRate);
  const schedule = [];
  let balance = input.loanAmount;
  let totalInterest = 0;
  let totalPaid = 0;
  let month = 0;

  while (balance > 0.01 && month < totalMonths + 1) {
    month += 1;
    const interestPaid = monthlyRate === 0 ? 0 : balance * monthlyRate;
    let principalPaid;
    let paymentForMonth;

    if (input.mortgageType === "interestOnly") {
      principalPaid = month === totalMonths ? balance : 0;
      paymentForMonth = interestPaid + principalPaid;
    } else {
      principalPaid = Math.min(balance, regularPayment - interestPaid);
      paymentForMonth = principalPaid + interestPaid;
    }

    balance = Math.max(0, balance - principalPaid);
    totalInterest += interestPaid;
    totalPaid += paymentForMonth;

    if (month <= monthsToShow) {
      schedule.push({
        month,
        payment: roundCurrency(paymentForMonth),
        principal: roundCurrency(principalPaid),
        interest: roundCurrency(interestPaid),
        balance: roundCurrency(balance),
      });
    }
  }

  return {
    schedule,
    monthsElapsed: month,
    totalInterest: roundCurrency(totalInterest),
    totalPaid: roundCurrency(totalPaid),
    basePayment: roundCurrency(basePayment),
  };
}

export function calculateMortgageDetails(input) {
  const errors = validateInputs(input);
  if (errors.length) {
    return { errors };
  }

  const { schedule, monthsElapsed, totalInterest, totalPaid, basePayment } =
    buildAmortizationSchedule(input);
  const extraPayment = input.mortgageType === "interestOnly" ? 0 : input.extraPayment;
  const monthlyPayment =
    input.mortgageType === "interestOnly"
      ? basePayment
      : roundCurrency(basePayment + extraPayment);
  const ltv = roundCurrency((input.loanAmount / input.propertyValue) * 100);
  const depositRatio = roundCurrency((input.downPayment / input.propertyValue) * 100);
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + monthsElapsed);

  return {
    errors: [],
    basePayment,
    monthlyPayment,
    totalInterest,
    totalPaid,
    ltv,
    depositRatio,
    monthsElapsed,
    payoffDate,
    schedule,
  };
}
