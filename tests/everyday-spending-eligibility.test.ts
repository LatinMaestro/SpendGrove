import { describe, expect, it } from "vitest";
import {
  isEligibleEverydayExpense,
  type EverydayExpenseEligibilityRecord,
} from "@/lib/everyday-spending-eligibility";

const july = {
  dateFrom: new Date("2026-07-01T00:00:00.000Z"),
  dateTo: new Date("2026-08-01T00:00:00.000Z"),
};

function expense(overrides: Partial<EverydayExpenseEligibilityRecord> = {}): EverydayExpenseEligibilityRecord {
  return {
    userId: "user_1",
    type: "EXPENSE",
    status: "ACTIVE",
    splitRole: "NONE",
    deletedAt: null,
    amountCents: -1000,
    date: "2026-07-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("canonical everyday spending eligibility", () => {
  it("includes negative owned active expenses and eligible split children", () => {
    expect(isEligibleEverydayExpense("user_1", expense(), july)).toBe(true);
    expect(isEligibleEverydayExpense("user_1", expense({ splitRole: "CHILD" }), july)).toBe(true);
  });

  it.each([
    ["positive expense anomaly", { amountCents: 250000 }],
    ["zero expense anomaly", { amountCents: 0 }],
    ["income", { type: "INCOME", amountCents: 250000 }],
    ["incoming transfer", { type: "TRANSFER", amountCents: 250000 }],
    ["outgoing transfer", { type: "TRANSFER", amountCents: -250000 }],
    ["analytical loan record", { type: "LOAN_REPAYMENT" }],
    ["split parent", { splitRole: "PARENT" }],
    ["deleted", { status: "DELETED", deletedAt: "2026-07-11T00:00:00.000Z" }],
    ["other owner", { userId: "user_2" }],
    ["other month", { date: "2026-08-01T00:00:00.000Z" }],
    ["invalid date", { date: "not-a-date" }],
  ])("excludes %s", (_label, overrides) => {
    expect(isEligibleEverydayExpense("user_1", expense(overrides), july)).toBe(false);
  });
});
