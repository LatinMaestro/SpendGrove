import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { getEverydayInsights } from "@/src/server/everyday-insights";
import { listSafeImportHistory } from "@/src/server/import-history";
import {
  buildLoanFinancialYearReport,
  type LoanFinancialYearReport,
} from "@/src/server/loan-reporting";
import { listSafeLoanRepayments } from "@/src/server/loan-repayment-history";
import { listLoanMetadata } from "@/src/server/loan-metadata";
import {
  buildPropertyFinancialYearReport,
  type PropertyFinancialYearReport,
} from "@/src/server/property-financial-reporting";
import { getPropertyRecordReview, propertyFinancialYearSchema } from "@/src/server/property-report-review";

export const ACCOUNTANT_PACK_CONTRACT = "spendgrove.accountant-preparation-pack";
export const ACCOUNTANT_PACK_VERSION = 1 as const;

type PlanningInsights = Awaited<ReturnType<typeof getEverydayInsights>>;
type ImportHistory = Awaited<ReturnType<typeof listSafeImportHistory>>;

export type AccountantPackManifest = {
  contract: typeof ACCOUNTANT_PACK_CONTRACT;
  version: typeof ACCOUNTANT_PACK_VERSION;
  generatedAt: string;
  financialYear: LoanFinancialYearReport["financialYear"];
  currency: "AUD";
  moneyRepresentation: "integer cents";
  disclaimer: string;
  files: Array<{ kind: string; label: string; url: string }>;
  loanSummary: LoanFinancialYearReport["loans"];
  propertySummaries: Array<{
    propertyId: string;
    nickname: string;
    linkedRecordCount: number;
    moneyInCents: number;
    moneyOutCents: number;
    loanInterestCents: number;
    loanFeeCents: number;
    principalRecordedCents: number;
    needsReviewRecordIds: string[];
    sourceTransactionIds: string[];
  }>;
  currentPlanningSnapshot: {
    month: { key: string; label: string };
    budgets: PlanningInsights["budgets"];
    recurring: PlanningInsights["recurring"];
  };
  importAuditSummary: {
    completedBatchCount: number;
    importedCount: number;
    skippedCount: number;
    mergedCount: number;
    warningCount: number;
    privateFieldCount: number;
  };
  evidenceIndex: Array<{
    group: "PROPERTY_RECORDS" | "LOAN_COMPONENTS" | "DOCUMENTS";
    label: string;
    recordIds: string[];
    note: string;
  }>;
};

function sumChecked(values: number[]) {
  return values.reduce((total, value) => {
    const next = total + value;
    if (!Number.isSafeInteger(next)) throw new Error("ACCOUNTANT_PACK_TOTAL_OVERFLOW");
    return next;
  }, 0);
}

export function assembleAccountantPackManifest(
  loanReport: LoanFinancialYearReport,
  propertyReports: PropertyFinancialYearReport[],
  insights: PlanningInsights,
  imports: ImportHistory,
  now = new Date(),
): AccountantPackManifest {
  const propertySummaries = propertyReports.map((report) => ({
    propertyId: report.property.id,
    nickname: report.property.nickname,
    linkedRecordCount: report.records.length,
    moneyInCents: report.cashflow.moneyIn.totalCents,
    moneyOutCents: report.cashflow.moneyOut.totalCents,
    loanInterestCents: report.loanComponents.interestCents,
    loanFeeCents: report.loanComponents.feeCents,
    principalRecordedCents: report.loanComponents.principalCents,
    needsReviewRecordIds: report.records.filter((record) => record.needsReview).map((record) => record.transactionId),
    sourceTransactionIds: report.records.map((record) => record.transactionId),
  }));

  const files = [
    {
      kind: "MANIFEST_JSON",
      label: "Preparation-pack manifest",
      url: `/api/account/reports/accountant-pack/manifest?financialYear=${loanReport.financialYear.endingYear}`,
    },
    {
      kind: "README_TEXT",
      label: "Read me",
      url: `/api/account/reports/accountant-pack/readme?financialYear=${loanReport.financialYear.endingYear}`,
    },
    {
      kind: "LOAN_CSV",
      label: "Loan component report",
      url: `/api/account/reports/loans/export?financialYear=${loanReport.financialYear.endingYear}`,
    },
    ...propertySummaries.map((property) => ({
      kind: "PROPERTY_CSV",
      label: `${property.nickname} linked records`,
      url: `/api/account/properties/${encodeURIComponent(property.propertyId)}/report-export?financialYear=${loanReport.financialYear.endingYear}`,
    })),
    {
      kind: "ACCOUNT_EXPORT_JSON",
      label: "Full account export",
      url: "/api/account/export",
    },
  ];

  const incompleteLoans = loanReport.loans.filter((loan) => loan.incompleteComponentCount > 0);
  const propertyNeedsReview = propertySummaries.flatMap((property) => property.needsReviewRecordIds);

  return {
    contract: ACCOUNTANT_PACK_CONTRACT,
    version: ACCOUNTANT_PACK_VERSION,
    generatedAt: now.toISOString(),
    financialYear: loanReport.financialYear,
    currency: "AUD",
    moneyRepresentation: "integer cents",
    disclaimer: "Organisational preparation only. SpendGrove does not determine deductibility or provide tax, accounting or financial advice.",
    files,
    loanSummary: loanReport.loans,
    propertySummaries,
    currentPlanningSnapshot: {
      month: { key: insights.currentMonth.key, label: insights.currentMonth.label },
      budgets: insights.budgets,
      recurring: insights.recurring,
    },
    importAuditSummary: {
      completedBatchCount: imports.length,
      importedCount: sumChecked(imports.map((entry) => entry.importedCount)),
      skippedCount: sumChecked(imports.map((entry) => entry.skippedCount)),
      mergedCount: sumChecked(imports.map((entry) => entry.mergedCount)),
      warningCount: sumChecked(imports.map((entry) => entry.warningCount)),
      privateFieldCount: sumChecked(imports.map((entry) => entry.privateFieldCount)),
    },
    evidenceIndex: [
      {
        group: "PROPERTY_RECORDS",
        label: "Property records needing review",
        recordIds: propertyNeedsReview,
        note: "Review the source record and ask a registered tax agent or accountant what evidence is appropriate.",
      },
      {
        group: "LOAN_COMPONENTS",
        label: "Loan repayments with incomplete components",
        recordIds: incompleteLoans.map((loan) => loan.loanId),
        note: "Check the lender statement for missing principal, interest or fee information.",
      },
      {
        group: "DOCUMENTS",
        label: "Document evidence placeholders",
        recordIds: [],
        note: "Document upload is not active. Keep supporting evidence in your existing secure records.",
      },
    ],
  };
}

export async function createAccountantPackManifest(
  context: AuthenticatedUserContext | null | undefined,
  endingYear: unknown,
  now = new Date(),
) {
  const validatedYear = propertyFinancialYearSchema.parse(endingYear);
  const [metadata, repayments, insights, imports] = await Promise.all([
    listLoanMetadata(context),
    listSafeLoanRepayments(context),
    getEverydayInsights(context),
    listSafeImportHistory(context, undefined, { limit: 50, rowLimit: 1 }),
  ]);
  const loanReport = buildLoanFinancialYearReport(metadata.loans, repayments, validatedYear);
  const activeProperties = metadata.properties.filter((property) => !property.isArchived);
  const reviews = await Promise.all(
    activeProperties.map((property) => getPropertyRecordReview(context, property.id, validatedYear)),
  );
  const propertyReports = reviews.map((review) => buildPropertyFinancialYearReport(review, metadata.loans, repayments));
  return assembleAccountantPackManifest(loanReport, propertyReports, insights, imports, now);
}

export function accountantPackManifestFileName(manifest: AccountantPackManifest) {
  return `spendgrove-accountant-pack-${manifest.financialYear.label}.json`;
}

export function accountantPackReadme(manifest: AccountantPackManifest) {
  return [
    "SpendGrove accountant preparation pack",
    `Financial year: ${manifest.financialYear.label}`,
    `Generated: ${manifest.generatedAt}`,
    "",
    "How to use this pack",
    "1. Download the manifest and each listed CSV or JSON file.",
    "2. Keep the files together in a secure folder.",
    "3. Review records marked as needing review.",
    "4. Ask your registered tax agent or accountant how the records apply to your circumstances.",
    "",
    "Important boundaries",
    "- Everyday transactions are the sole cashflow records.",
    "- Loan repayment components explain repayments and are not added as a second cashflow total.",
    "- Principal is recorded separately and is not treated as a Property expense.",
    "- Raw CSV files, filenames and bank account identifiers are not included.",
    "- Document evidence upload is not active.",
    "",
    manifest.disclaimer,
  ].join("\n");
}
