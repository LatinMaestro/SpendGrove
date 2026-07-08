import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function source(path: string) { return readFile(new URL(`../${path}`, import.meta.url), "utf8"); }

describe("imported account transactions UI", () => {
  it("shows manual and imported transactions together with a clear source label", async () => {
    const component = await source("components/durable-manual-transactions.tsx");
    expect(component).toContain("Manual and imported transactions are shown together");
    expect(component).toContain('transaction.source === "IMPORTED" ? "Imported" : "Manual"');
    expect(component).toContain("Add a manual transaction or commit a reviewed CSV import");
  });

  it("uses the existing account editor and soft-delete confirmation for imported records", async () => {
    const component = await source("components/durable-manual-transactions.tsx");
    expect(component).toContain("updateAccountTransaction");
    expect(component).toContain("deleteAccountTransaction");
    expect(component).toContain("Import history is kept");
    expect(component).toContain("Edit");
    expect(component).toContain("Delete from active list");
  });

  it("lets manual transaction create and edit choose a neutral Property record link", async () => {
    const component = await source("components/durable-manual-transactions.tsx");

    expect(component).toContain("Include in property records");
    expect(component).toContain("Link to property");
    expect(component).toContain("No Property link");
    expect(component).toContain("Record keeping only - not tax advice");
    expect(component).toContain("setTransactionPropertyLink");
    expect(component).toContain('method: "POST"');
    expect(component).toContain('method: "DELETE"');
    expect(component).toContain("The transaction was saved, but the Property link could not be updated safely.");
  });

  it("keeps manual transaction Property-link responses tied to the saved transaction", async () => {
    const createRoute = await source("app/api/account/manual-transactions/route.ts");
    const updateRoute = await source("app/api/account/manual-transactions/[transactionId]/route.ts");

    expect(createRoute).toContain("const savedTransaction = await createDurableManualTransaction");
    expect(createRoute).toContain("transactions, savedTransaction");
    expect(updateRoute).toContain("const savedTransaction = await updateDurableManualTransaction");
    expect(updateRoute).toContain("transactions, savedTransaction");
  });

  it("does not add forbidden tax/reporting wording to the manual Property-link editor", async () => {
    const component = await source("components/durable-manual-transactions.tsx");
    const propertyBlock = component.slice(component.indexOf("Include in property records"), component.indexOf("May match a future CSV row"));

    expect(propertyBlock).not.toMatch(/deductible|claimable|taxable|ATO-ready|tax-ready|accountant approved|automatically classified for tax/i);
  });

  it("keeps the signed-out browser-local fallback unchanged", async () => {
    const component = await source("components/durable-manual-transactions.tsx");
    expect(component).toContain("<ManualTransactions />");
    expect(component).toContain("if (!isSignedIn) return <SignedOutFallback />");
  });

  it("queries active user-owned transactions without excluding imported source", async () => {
    const server = await source("src/server/manual-transactions.ts");
    const listSection = server.slice(server.indexOf("async listActive"), server.indexOf("async findActiveById"));
    expect(listSection).toContain("userId");
    expect(listSection).toContain('status: "ACTIVE"');
    expect(listSection).toContain("deletedAt: null");
    expect(listSection).toContain('not: "PARENT"');
    expect(listSection).not.toContain('source: "MANUAL"');
  });
});
