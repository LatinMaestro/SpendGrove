import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PHASE_10_COLLABORATION_RUNTIME_ENABLED,
  requirePhase10CollaborationRuntime,
} from "@/src/server/phase-10-runtime";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync(
  "prisma/migrations/20260717130000_phase_10_household_accountant_foundation/migration.sql",
  "utf8",
);

describe("Phase 10 household and accountant schema foundation", () => {
  it("fails closed before any collaboration table access", () => {
    expect(PHASE_10_COLLABORATION_RUNTIME_ENABLED).toBe(false);
    expect(() => requirePhase10CollaborationRuntime())
      .toThrow("PHASE_10_COLLABORATION_NOT_AVAILABLE");
  });

  it("adds only the six approved collaboration models", () => {
    for (const model of [
      "Household",
      "HouseholdMembership",
      "HouseholdInvitation",
      "HouseholdRecordShare",
      "AccountantAccessGrant",
      "AccountantAccessScope",
    ]) {
      expect(schema).toContain(`model ${model}`);
      expect(migration).toContain(`CREATE TABLE "${model}"`);
    }
    expect(schema).toContain("@@unique([householdId, userId])");
    expect(schema).toContain("@@unique([householdId, ownerUserId, entityType, entityId])");
    expect(schema).toContain("@@unique([grantId, scopeType, scopeKey])");
  });

  it("stores hashes rather than raw invitation credentials", () => {
    expect(schema).toContain("tokenHash");
    expect(schema).toContain("intendedIdentityHash");
    expect(schema).not.toMatch(/rawToken|invitationToken\s+String|providerPayload/);
    expect(migration).not.toMatch(/rawToken|invitationToken|emailAddress|providerPayload/i);
  });

  it("keeps source financial records unchanged and generic scopes owner constrained", () => {
    expect(migration).not.toMatch(/ALTER TABLE "(?:Transaction|Property|LoanAccount|CategoryBudget|RecurringItem|SavingsGoal|NetWorthSnapshot)"/);
    expect(migration).not.toMatch(/UPDATE\s+"|DELETE\s+FROM|DROP\s+(?:TABLE|COLUMN|TYPE)/i);
    expect(schema).toContain("ownerUserId String");
    expect(schema).toContain("entityId    String");
    expect(schema).toContain("scopeKey    String");
  });

  it("adds safe audit values without private or financial payload fields", () => {
    for (const value of [
      "HOUSEHOLD",
      "HOUSEHOLD_MEMBERSHIP",
      "HOUSEHOLD_INVITATION",
      "HOUSEHOLD_RECORD_SHARE",
      "ACCOUNTANT_ACCESS_GRANT",
      "ACCOUNTANT_ACCESS_SCOPE",
    ]) {
      expect(schema).toContain(value);
      expect(migration).toContain(value);
    }
    expect(migration).not.toMatch(/amountCents|rawNarration|accountNumber|bsb|filename|merchantName|exactAddress/i);
  });
});
