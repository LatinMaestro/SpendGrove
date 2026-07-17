import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/reports/accountant-pack/page.tsx", "utf8");
const service = readFileSync("src/server/accountant-pack.ts", "utf8");
const manifestRoute = readFileSync("app/api/account/reports/accountant-pack/manifest/route.ts", "utf8");
const readmeRoute = readFileSync("app/api/account/reports/accountant-pack/readme/route.ts", "utf8");
const centre = readFileSync("app/reports/page.tsx", "utf8");

describe("Phase 8 accountant-pack UI", () => {
  it("is authenticated, owner-scoped and reachable from Reports", () => {
    expect(centre).toContain('href="/reports/accountant-pack"');
    expect(page).toContain("<AppShell>");
    expect(page).toContain("getCurrentUserContext");
    expect(service).toContain("listLoanMetadata");
    expect(service).toContain("listSafeLoanRepayments");
    expect(service).toContain("listSafeImportHistory");
    expect(manifestRoute).toContain("getCurrentUserContext");
    expect(readmeRoute).toContain("getCurrentUserContext");
  });

  it("uses individual downloads without ZIP or a new storage workflow", () => {
    expect(page).toContain("Manifest JSON");
    expect(page).toContain("Read me");
    expect(page).toContain("Loan report CSV");
    expect(page).toContain("Full account export");
    expect(page).toContain("Download CSV");
    expect(page).toContain("No ZIP tool or document upload is required");
    expect(page).not.toContain("JSZip");
  });

  it("keeps cache, privacy and professional-review boundaries explicit", () => {
    expect(manifestRoute).toContain("private, no-store");
    expect(readmeRoute).toContain("private, no-store");
    expect(page).toContain("Document upload is not active");
    expect(service).toContain("does not determine deductibility");
    expect(service).not.toMatch(/ATO-ready|claimable|tax saving|tax refund/i);
  });

  it("does not access guarded migration-dependent structures", () => {
    expect(service).not.toContain("TransferLink");
    expect(service).not.toContain("BulkOperation");
    expect(service).not.toContain("ImportUndo");
  });
});
