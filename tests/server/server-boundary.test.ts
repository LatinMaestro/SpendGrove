import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const CLIENT_FACING_DIRS = ["app", "components", "lib"];
const CLIENT_FILE_EXTENSIONS = new Set([".ts", ".tsx"]);
const SERVER_DB_IMPORT_PATTERNS = [
  /from\s+["']@\/src\/server\/db["']/,
  /from\s+["']@\/src\/server["']/,
  /from\s+["']\.\.\/src\/server\/db["']/,
  /from\s+["']\.\/src\/server\/db["']/,
  /PrismaClient/,
];
const PRODUCT_WRITE_PATTERNS = [
  { name: "transaction.create", pattern: /transaction\.create\s*\(/ },
  { name: "transaction.createMany", pattern: /transaction\.createMany\s*\(/ },
  { name: "transaction.update", pattern: /transaction\.update\s*\(/ },
  { name: "transaction.updateMany", pattern: /transaction\.updateMany\s*\(/ },
  { name: "transaction.upsert", pattern: /transaction\.upsert\s*\(/ },
  { name: "transaction.delete", pattern: /transaction\.delete\s*\(/ },
  { name: "transaction.deleteMany", pattern: /transaction\.deleteMany\s*\(/ },
  { name: "importBatch.write", pattern: /importBatch\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
  { name: "importRow.write", pattern: /importRow\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
  { name: "auditEvent.write", pattern: /auditEvent\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
  { name: "loanRepayment.write", pattern: /loanRepayment\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
  { name: "loanReconciliationLink.write", pattern: /loanReconciliationLink\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
  { name: "propertyTransactionLink.write", pattern: /propertyTransactionLink\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
  { name: "propertyReportReview.write", pattern: /propertyReportReview\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
  { name: "recurringItem.write", pattern: /recurringItem\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
  { name: "recurringSuggestionDismissal.write", pattern: /recurringSuggestionDismissal\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
  { name: "categoryBudget.write", pattern: /categoryBudget\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
  { name: "bulkOperation.write", pattern: /bulkOperation\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
  { name: "bulkOperationItem.write", pattern: /bulkOperationItem\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
  { name: "category.create", pattern: /category\.create\s*\(/ },
  { name: "category.createMany", pattern: /category\.createMany\s*\(/ },
  { name: "category.update", pattern: /category\.update\s*\(/ },
  { name: "category.updateMany", pattern: /category\.updateMany\s*\(/ },
  { name: "category.upsert", pattern: /category\.upsert\s*\(/ },
  { name: "category.delete", pattern: /category\.delete\s*\(/ },
  { name: "category.deleteMany", pattern: /category\.deleteMany\s*\(/ },
  { name: "bankImportProfile.create", pattern: /bankImportProfile\.create\s*\(/ },
  { name: "bankImportProfile.createMany", pattern: /bankImportProfile\.createMany\s*\(/ },
  { name: "bankImportProfile.update", pattern: /bankImportProfile\.update\s*\(/ },
  { name: "bankImportProfile.updateMany", pattern: /bankImportProfile\.updateMany\s*\(/ },
  { name: "bankImportProfile.upsert", pattern: /bankImportProfile\.upsert\s*\(/ },
  { name: "bankImportProfile.delete", pattern: /bankImportProfile\.delete\s*\(/ },
  { name: "bankImportProfile.deleteMany", pattern: /bankImportProfile\.deleteMany\s*\(/ },
  { name: "merchantProfile.write", pattern: /merchantProfile\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
  { name: "merchantAlias.write", pattern: /merchantAlias\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
  { name: "merchantRule.write", pattern: /merchantRule\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/ },
];
const APPROVED_PRODUCT_WRITES = new Map<string, Set<string>>([
  [
    "src/server/manual-transactions.ts",
    new Set([
      "transaction.create",
      "transaction.update",
      "category.upsert",
    ]),
  ],
  [
    "src/server/custom-categories.ts",
    new Set([
      "category.create",
      "category.update",
      "category.upsert",
    ]),
  ],
  [
    "src/server/saved-import-profiles.ts",
    new Set([
      "bankImportProfile.create",
      "bankImportProfile.update",
      "bankImportProfile.delete",
      "bankImportProfile.deleteMany",
    ]),
  ],
  [
    "src/server/merchant-rules.ts",
    new Set([
      "category.upsert",
      "merchantProfile.write",
      "merchantAlias.write",
      "merchantRule.write",
    ]),
  ],
  [
    "src/server/import-commit.ts",
    new Set([
      "transaction.createMany",
      "importBatch.write",
      "importRow.write",
      "auditEvent.write",
      "propertyTransactionLink.write",
      "category.upsert",
    ]),
  ],
  [
    "src/server/loan-repayments.ts",
    new Set([
      "importBatch.write",
      "loanRepayment.write",
      "auditEvent.write",
    ]),
  ],
  [
    "src/server/loan-repayment-history.ts",
    new Set([
      "loanRepayment.write",
      "auditEvent.write",
    ]),
  ],
  [
    "src/server/loan-reconciliation-links.ts",
    new Set([
      "loanRepayment.write",
      "loanReconciliationLink.write",
      "auditEvent.write",
    ]),
  ],
  [
    "src/server/development-transaction-reset.ts",
    new Set([
      "transaction.updateMany",
      "loanRepayment.write",
      "loanReconciliationLink.write",
      "propertyTransactionLink.write",
      "auditEvent.write",
    ]),
  ],
  [
    "src/server/property-transaction-links.ts",
    new Set([
      "propertyTransactionLink.write",
      "auditEvent.write",
    ]),
  ],
  [
    "src/server/property-report-review.ts",
    new Set([
      "propertyReportReview.write",
      "auditEvent.write",
    ]),
  ],
  [
    "src/server/recurring-suggestions.ts",
    new Set([
      "recurringItem.write",
      "recurringSuggestionDismissal.write",
      "auditEvent.write",
    ]),
  ],
  [
    "src/server/category-budgets.ts",
    new Set([
      "categoryBudget.write",
      "auditEvent.write",
    ]),
  ],
  [
    "src/server/savings-goals.ts",
    new Set([
      "savingsGoal.write",
      "savingsGoalContribution.write",
      "auditEvent.write",
    ]),
  ],
  [
    "src/server/net-worth.ts",
    new Set([
      "netWorthItem.write",
      "netWorthValuation.write",
      "netWorthSnapshot.write",
      "auditEvent.write",
    ]),
  ],
  [
    "src/server/advanced-recurring.ts",
    new Set([
      "recurringItem.write",
      "recurringInstance.write",
      "auditEvent.write",
    ]),
  ],
  [
    "src/server/in-app-reminders.ts",
    new Set([
      "reminderPreference.write",
      "reminder.write",
      "auditEvent.write",
    ]),
  ],
  [
    "src/server/bulk-operations.ts",
    new Set([
      "transaction.updateMany",
      "propertyTransactionLink.write",
      "auditEvent.write",
      "bulkOperation.write",
      "bulkOperationItem.write",
    ]),
  ],
  [
    "src/server/transfer-links.ts",
    new Set([
      "transferLink.write",
      "auditEvent.write",
    ]),
  ],
  [
    "src/server/account-deletion.ts",
    new Set([
      "transaction.deleteMany",
      "importBatch.write",
      "importRow.write",
      "auditEvent.write",
      "loanRepayment.write",
      "loanReconciliationLink.write",
      "propertyTransactionLink.write",
      "propertyReportReview.write",
      "recurringItem.write",
      "recurringSuggestionDismissal.write",
      "categoryBudget.write",
      "category.deleteMany",
      "bankImportProfile.deleteMany",
      "merchantProfile.write",
      "merchantAlias.write",
      "merchantRule.write",
    ]),
  ],
]);

async function listFiles(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return listFiles(entryPath);
      if (CLIENT_FILE_EXTENSIONS.has(path.extname(entry.name))) return [entryPath];
      return [];
    }));
    return files.flat();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

describe("server persistence boundaries", () => {
  it("keeps Prisma and server db imports out of client-facing source folders", async () => {
    const files = (await Promise.all(CLIENT_FACING_DIRS.map(listFiles))).flat();
    const violations: string[] = [];
    for (const file of files) {
      const source = await readFile(file, "utf8");
      if (SERVER_DB_IMPORT_PATTERNS.some((pattern) => pattern.test(source))) violations.push(file);
    }
    expect(violations).toEqual([]);
  });

  it("allows only approved product write paths", async () => {
    const files = await listFiles("src/server");
    const violations: string[] = [];
    for (const file of files) {
      const source = await readFile(file, "utf8");
      const repoPath = file.split(path.sep).join("/");
      const approvedWrites = APPROVED_PRODUCT_WRITES.get(repoPath) ?? new Set<string>();
      for (const write of PRODUCT_WRITE_PATTERNS) {
        if (write.pattern.test(source) && !approvedWrites.has(write.name)) violations.push(`${repoPath}: ${write.name}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
