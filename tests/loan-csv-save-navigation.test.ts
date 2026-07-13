import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const reviewPath = new URL("../components/loan-csv-review.tsx", import.meta.url);
const loansPagePath = new URL("../app/loans/page.tsx", import.meta.url);
const loansManagerPath = new URL("../components/loans-manager.tsx", import.meta.url);

async function saveFlowSource() {
  const source = await readFile(reviewPath, "utf8");
  const start = source.indexOf("async function saveReviewedRepayments");
  const end = source.indexOf("\n  if (!isLoaded)", start);
  return source.slice(start, end);
}

describe("loan CSV post-save navigation", () => {
  it("replaces the import route with Loans only after a successful durable save", async () => {
    const flow = await saveFlowSource();
    const failureGuard = flow.indexOf("if (!response.ok || !result.ok || !result.summary)");
    const navigation = flow.indexOf('router.replace(`/loans?loanImport=saved&saved=${result.summary.savedCount}`)');
    const catchBlock = flow.indexOf("} catch (saveError)");

    expect(flow).toContain("const payload = pendingRequest ?? createLoanRepaymentCommitRequest");
    expect(flow).toContain("setPendingRequest(payload)");
    expect(failureGuard).toBeGreaterThan(-1);
    expect(navigation).toBeGreaterThan(failureGuard);
    expect(navigation).toBeLessThan(catchBlock);
  });

  it("keeps failed saves on the review screen with the existing safe error", async () => {
    const flow = await saveFlowSource();
    const catchBlock = flow.slice(flow.indexOf("} catch (saveError)"));

    expect(catchBlock).toContain("setError(saveError instanceof Error ? saveError.message");
    expect(catchBlock).not.toContain("router.");
  });

  it("uses history replacement so browser back cannot resubmit the frozen review", async () => {
    const flow = await saveFlowSource();

    expect(flow).toContain("router.replace(");
    expect(flow).not.toContain("router.push(");
    expect(flow.match(/fetch\("\/api\/account\/loan-repayments",/g)).toHaveLength(1);
    expect(flow).toContain("pendingRequest ??");
  });

  it("shows only a bounded aggregate saved count on Loans and preserves duplicate/count safeguards", async () => {
    const [review, page, manager] = await Promise.all([
      readFile(reviewPath, "utf8"),
      readFile(loansPagePath, "utf8"),
      readFile(loansManagerPath, "utf8"),
    ]);
    const navigationLine = review.split("\n").find((line) => line.includes("router.replace")) ?? "";

    expect(page).toContain("count > 0 && count <= 5000");
    expect(manager).toContain("Loan CSV imported.");
    expect(manager).toContain("Repayments were saved.");
    expect(manager).toContain("loanImportSavedCount");
    expect(navigationLine).not.toMatch(/loanAccount|nickname|filename|narration|reference|balance/i);
    expect(review).toContain("duplicateOverrideRowNumbers");
    expect(review).toContain("Likely duplicate");
    expect(review).toContain("Possible overlap");
    expect(review).toContain("review.rows.length - selectedRowNumbers.size");
    expect(review).toContain("excludedCount: result.summary!.excludedCount");
  });
});
