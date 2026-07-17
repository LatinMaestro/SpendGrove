import type { LoanCsvColumnRole, LoanCsvMappingMode } from "@/lib/loan-csv-review";

export type LoanCsvStructuralModeDefinition = {
  id: LoanCsvMappingMode;
  displayName: string;
  description: string;
  supportStatus: "CONFIRMED_STRUCTURAL_MODE";
  requiredColumns: {
    allOf: readonly LoanCsvColumnRole[];
    atLeastOneOf: readonly LoanCsvColumnRole[];
  };
  optionalColumns: readonly LoanCsvColumnRole[];
  fixtureIds: readonly string[];
};

export type NamedLoanCsvProfile = {
  id: string;
  lenderName: string;
  mode: LoanCsvMappingMode;
  fixtureIds: readonly string[];
};

export const loanCsvStructuralModes = [
  {
    id: "COMPONENT_COLUMNS",
    displayName: "Repayment breakdown",
    description: "A repayment date with a total repayment, principal, interest or fees column.",
    supportStatus: "CONFIRMED_STRUCTURAL_MODE",
    requiredColumns: {
      allOf: ["DATE"],
      atLeastOneOf: ["TOTAL_PAYMENT", "PRINCIPAL", "INTEREST", "FEES"],
    },
    optionalColumns: ["BALANCE_AFTER"],
    fixtureIds: ["home_loan_synthetic.csv"],
  },
  {
    id: "ROW_EVENT_LEDGER",
    displayName: "Loan ledger",
    description: "An event date, signed amount and loan event type, with an optional balance after.",
    supportStatus: "CONFIRMED_STRUCTURAL_MODE",
    requiredColumns: {
      allOf: ["DATE", "SIGNED_AMOUNT", "EVENT_TYPE"],
      atLeastOneOf: [],
    },
    optionalColumns: ["BALANCE_AFTER"],
    fixtureIds: ["inline-row-event-ledger-synthetic"],
  },
] as const satisfies readonly LoanCsvStructuralModeDefinition[];

export const namedLoanCsvProfiles: readonly NamedLoanCsvProfile[] = [];

export function getLoanCsvStructuralMode(id: LoanCsvMappingMode) {
  return loanCsvStructuralModes.find((mode) => mode.id === id);
}
