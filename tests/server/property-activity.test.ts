import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { getPropertyActivity, type PropertyActivityStore } from "@/src/server/property-activity";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/property-activity.ts", import.meta.url);
const componentPath = new URL("../../components/property-record-keeping-activity.tsx", import.meta.url);

describe("Property record-keeping activity", () => {
  it("scopes every activity request to the authenticated user", async () => {
    const calls: Array<{ userId: string; propertyId: string }> = [];
    const store: PropertyActivityStore = {
      async read(userId, propertyId) {
        calls.push({ userId, propertyId });
        return {
          property: { id: propertyId, nickname: "Sample Property", usage: "OTHER", isArchived: false },
          transactions: [],
          loanTransactions: [],
          loans: [],
        };
      },
    };

    await expect(getPropertyActivity(createTestUserContext("user_1"), "property_1", store)).resolves.toMatchObject({
      property: { id: "property_1" },
    });
    expect(calls).toEqual([{ userId: "user_1", propertyId: "property_1" }]);
  });

  it("revalidates ownership and active link/transaction state without copying source text", async () => {
    const service = await readFile(servicePath, "utf8");

    expect(service).toContain("where: { id: propertyId, userId, deletedAt: null }");
    expect(service).toContain("unlinkedAt: null");
    expect(service).toContain("loanReconciliationLink.findMany");
    expect(service).toContain("loanAccount: { userId, propertyId, isArchived: false, deletedAt: null }");
    expect(service).toContain('status: "ACTIVE"');
    expect(service).toContain("deletedAt: null");
    expect(service).toContain('splitRole: { not: "PARENT" }');
    expect(service).toContain("where: { userId, propertyId, deletedAt: null }");
    expect(service).not.toMatch(/description|notes|narration|filename|accountNumber|lenderName/);
  });

  it("keeps linked Loan Account context separate and calculates no statistics", async () => {
    const component = await readFile(componentPath, "utf8");

    expect(component).toContain("Linked through repayment breakdowns");
    expect(component).toContain("Manually linked property transactions");
    expect(component).toContain("Loan repayment transactions are shown here because this loan belongs to this Property.");
    expect(component).toContain("Manual Property links are for other property-related transactions you choose to attach yourself.");
    expect(component).toContain("These links do not change your transaction, category, amount or tax treatment.");
    expect(component).toContain("This view adds no extra payment or total.");
    expect(component).not.toMatch(/deduct|EOFY|tax advice|profit|yield|equity|valuation|net worth/i);
    expect(component).not.toMatch(/reduce\(|totalCents|average|percentage/);
  });
});
