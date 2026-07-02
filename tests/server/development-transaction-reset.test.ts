import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { DEVELOPMENT_TRANSACTION_RESET_CONFIRMATION } from "@/lib/development-testing";
import {
  createDevelopmentTransactionResetAuditEvent,
  resetTransactionsForDevelopment,
  type DevelopmentTransactionResetStore,
} from "@/src/server/development-transaction-reset";
import { isDevelopmentTestingEnvironment } from "@/src/server/development-testing";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/development-transaction-reset.ts", import.meta.url);
const routePath = new URL(
  "../../app/api/account/development-testing/transactions/reset/route.ts",
  import.meta.url,
);
const settingsPath = new URL("../../app/settings/page.tsx", import.meta.url);
const panelPath = new URL("../../components/development-transaction-reset-panel.tsx", import.meta.url);

describe("development transaction reset", () => {
  it("is available only in local development and Vercel Preview environments", () => {
    expect(isDevelopmentTestingEnvironment({ NODE_ENV: "development" })).toBe(true);
    expect(isDevelopmentTestingEnvironment({ NODE_ENV: "production", VERCEL_ENV: "preview" })).toBe(true);
    expect(isDevelopmentTestingEnvironment({ NODE_ENV: "production", VERCEL_ENV: "development" })).toBe(true);
    expect(isDevelopmentTestingEnvironment({ NODE_ENV: "production", VERCEL_ENV: "production" })).toBe(false);
    expect(isDevelopmentTestingEnvironment({ NODE_ENV: "production" })).toBe(false);
    expect(isDevelopmentTestingEnvironment({})).toBe(false);
  });

  it("requires the exact confirmation phrase before calling the owned reset store", async () => {
    let calls = 0;
    const store: DevelopmentTransactionResetStore = {
      async reset() {
        calls += 1;
        return { transactionsDeleted: 1, loanLinksDetached: 1, propertyLinksDetached: 1 };
      },
    };

    await expect(resetTransactionsForDevelopment(
      createTestUserContext("user_1"),
      { confirmation: "delete transactions" },
      store,
    )).rejects.toThrow();
    expect(calls).toBe(0);

    await expect(resetTransactionsForDevelopment(
      createTestUserContext("user_1"),
      { confirmation: DEVELOPMENT_TRANSACTION_RESET_CONFIRMATION },
      store,
    )).resolves.toEqual({ transactionsDeleted: 1, loanLinksDetached: 1, propertyLinksDetached: 1 });
    expect(calls).toBe(1);
  });

  it("passes only the authenticated user ID and produces aggregate-only audit metadata", async () => {
    const seenUsers: string[] = [];
    const store: DevelopmentTransactionResetStore = {
      async reset(userId) {
        seenUsers.push(userId);
        return { transactionsDeleted: 3, loanLinksDetached: 2, propertyLinksDetached: 1 };
      },
    };

    const summary = await resetTransactionsForDevelopment(
      createTestUserContext("user_1"),
      { confirmation: DEVELOPMENT_TRANSACTION_RESET_CONFIRMATION },
      store,
    );
    expect(seenUsers).toEqual(["user_1"]);
    expect(createDevelopmentTransactionResetAuditEvent("user_1", summary)).toEqual({
      userId: "user_1",
      entityType: "TRANSACTION",
      action: "DELETED",
      metadata: {
        reasonCode: "DEVELOPMENT_TEST_RESET",
        transactionCount: 3,
        loanLinkCount: 2,
        propertyLinkCount: 1,
      },
    });
  });

  it("soft-deletes transactions and detaches links without deleting protected records", async () => {
    const service = await readFile(servicePath, "utf8");

    expect(service).toContain("tx.transaction.updateMany");
    expect(service).toContain('data: { status: "DELETED", deletedAt: now }');
    expect(service).toContain("tx.loanReconciliationLink.updateMany");
    expect(service).toContain("tx.propertyTransactionLink.updateMany");
    expect(service).toContain("tx.loanRepayment.updateMany");
    expect(service).toContain('data: { reconciliationStatus: "UNMATCHED" }');
    expect(service).not.toMatch(/\.delete(?:Many)?\s*\(/);

    for (const protectedModel of [
      "user",
      "category",
      "userSettings",
      "merchantRule",
      "bankImportProfile",
      "property",
      "loanAccount",
      "loanRepayment.delete",
    ]) {
      expect(service).not.toContain(`tx.${protectedModel}.delete`);
    }
  });

  it("gates both Settings visibility and the API before authentication or database access", async () => {
    const [settings, route] = await Promise.all([
      readFile(settingsPath, "utf8"),
      readFile(routePath, "utf8"),
    ]);

    expect(settings).toContain("accountHistoryAvailable && isDevelopmentTestingEnvironment()");
    expect(settings).toContain("developmentTestingAvailable && <DevelopmentTransactionResetPanel />");
    expect(route.indexOf("if (!isDevelopmentTestingEnvironment())")).toBeLessThan(
      route.indexOf("getCurrentUserContext()"),
    );
    expect(route).toContain('status: 404');
  });

  it("uses safe aggregate-only UI and contains no private source output or logging", async () => {
    const [panel, service, route] = await Promise.all([
      readFile(panelPath, "utf8"),
      readFile(servicePath, "utf8"),
      readFile(routePath, "utf8"),
    ]);
    const combined = `${panel}\n${service}\n${route}`;

    expect(panel).toContain("transactionsDeleted");
    expect(panel).toContain("loanLinksDetached");
    expect(panel).toContain("propertyLinksDetached");
    expect(panel).toContain("DELETE TRANSACTIONS");
    expect(combined).not.toContain("console.");

    for (const forbiddenOutput of [
      "rawCsv",
      "rawRow",
      "originalFileName",
      "rawNarration",
      "accountNumber",
      "maskedReference",
      "exactAddress",
    ]) {
      expect(combined).not.toContain(forbiddenOutput);
    }
  });
});
