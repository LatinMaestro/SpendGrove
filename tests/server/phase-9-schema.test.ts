import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED, requirePhase9AdvancedFinanceRuntime } from "@/src/server/phase-9-runtime";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync(
  "prisma/migrations/20260717120000_phase_9_advanced_personal_finance_foundation/migration.sql",
  "utf8",
);

describe("Phase 9 advanced personal-finance schema foundation", () => {
  it("is fail-closed before any missing-table access", () => {
    expect(PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED).toBe(false);
    expect(() => requirePhase9AdvancedFinanceRuntime()).toThrow("PHASE_9_ADVANCED_FINANCE_NOT_AVAILABLE");
  });

  it("adds only the approved owner-scoped planning models", () => {
    for (const model of [
      "RecurringInstance",
      "SavingsGoal",
      "SavingsGoalContribution",
      "NetWorthItem",
      "NetWorthValuation",
      "NetWorthSnapshot",
      "NetWorthSnapshotEntry",
      "ReminderPreference",
      "Reminder",
    ]) {
      expect(schema).toContain(`model ${model}`);
      expect(migration).toContain(`CREATE TABLE "${model}"`);
    }
    expect(schema).toContain("userId");
    expect(schema).toContain("transactionId   String    @unique");
    expect(schema).toContain("@@unique([userId, family])");
    expect(schema).toContain("@@unique([userId, dedupeKey])");
  });

  it("preserves existing cashflow and budget fields without a rewrite", () => {
    expect(schema).toContain("expectedAmountCents");
    expect(schema).toContain("period      BudgetPeriod @default(MONTHLY)");
    expect(migration).not.toMatch(/UPDATE\s+"(?:Transaction|CategoryBudget|RecurringItem)"/i);
    expect(migration).not.toMatch(/DELETE\s+FROM|DROP\s+(?:TABLE|COLUMN|TYPE)/i);
    expect(migration).not.toContain('"expectedAmountCents" =');
  });

  it("adds nullable recurring compatibility fields and manual planning foundations", () => {
    expect(schema).toContain("expectedAmountMinCents     Int?");
    expect(schema).toContain("expectedAmountMaxCents     Int?");
    expect(schema).toContain("source                     RecurringItemSource?");
    expect(schema).toContain("detectionConfidence        RecurringDetectionConfidence?");
    expect(schema).toContain("openingProgressCents Int               @default(0)");
    expect(schema).toContain("valueCents     Int");
    expect(schema).toContain("isEnabled        Boolean        @default(false)");
  });

  it("adds safe audit entity values without private payload columns on reminders", () => {
    for (const value of [
      "RECURRING_INSTANCE",
      "SAVINGS_GOAL",
      "SAVINGS_GOAL_CONTRIBUTION",
      "NET_WORTH_ITEM",
      "NET_WORTH_VALUATION",
      "NET_WORTH_SNAPSHOT",
      "REMINDER_PREFERENCE",
      "REMINDER",
    ]) {
      expect(schema).toContain(value);
      expect(migration).toContain(value);
    }
    expect(migration).not.toMatch(/rawNarration|accountNumber|bsb|filename|merchantName/i);
  });
});
