import { readFile, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { primaryAndForeignKeyNames } from "./preview-migration-integrity-core.mjs";

const EXPECTED_MIGRATION = "20260703090000_phase_3c_property_reporting_review";
const EXPECTED_ENUM_VALUES = [
  "PROPERTY_INCOME",
  "PROPERTY_OUTGOING",
  "REFUND_OR_REVERSAL",
  "LOAN_PAYMENT_CONTEXT",
  "TRANSFER_CONTEXT",
  "OTHER_PROPERTY_RECORD",
  "EXCLUDED",
];
const EXPECTED_COLUMNS = [
  "classification",
  "createdAt",
  "id",
  "propertyId",
  "transactionId",
  "updatedAt",
  "userId",
];
const EXPECTED_INDEXES = [
  "PropertyReportReview_pkey",
  "PropertyReportReview_transactionId_key",
  "PropertyReportReview_userId_classification_idx",
  "PropertyReportReview_userId_propertyId_classification_idx",
];
const EXPECTED_CONSTRAINTS = [
  "PropertyReportReview_pkey",
  "PropertyReportReview_propertyId_fkey",
  "PropertyReportReview_transactionId_fkey",
  "PropertyReportReview_userId_fkey",
];
const SAFE_FAILURE_CODES = new Set([
  "FAILED_OR_UNRESOLVED_MIGRATION",
  "TARGET_MIGRATION_ALREADY_PRESENT",
  "TARGET_MIGRATION_NOT_APPLIED_ONCE",
  "REPORTING_TABLE_ALREADY_PRESENT",
  "REPORTING_ENUM_ALREADY_PRESENT",
  "REPORTING_ENUM_MISMATCH",
  "REPORTING_COLUMNS_MISMATCH",
  "REPORTING_INDEXES_MISMATCH",
  "REPORTING_CONSTRAINTS_MISMATCH",
  "REPORTING_TABLE_NOT_EMPTY",
  "EXISTING_ROW_COUNTS_CHANGED",
  "MISSING_PRE_MIGRATION_STATE",
  "INVALID_MODE",
]);

function fail(code) {
  throw new Error(code);
}

function equalValues(actual, expected) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function parseArguments() {
  const mode = process.argv[2];
  const stateFlag = process.argv.indexOf("--state-file");
  const stateFile = stateFlag >= 0 ? process.argv[stateFlag + 1] : undefined;
  const expectedCountsFlag = process.argv.indexOf("--expected-counts-json");
  const expectedCountsJson = expectedCountsFlag >= 0 ? process.argv[expectedCountsFlag + 1] : undefined;
  if ((mode !== "pre" && mode !== "post") || (mode === "pre" && !stateFile) || (mode === "post" && !stateFile && !expectedCountsJson)) {
    fail("INVALID_MODE");
  }
  return { mode, stateFile, expectedCountsJson };
}

async function existingCounts(prisma) {
  const entries = await Promise.all([
    ["User", prisma.user.count()],
    ["Transaction", prisma.transaction.count()],
    ["Property", prisma.property.count()],
    ["LoanAccount", prisma.loanAccount.count()],
    ["LoanRepayment", prisma.loanRepayment.count()],
    ["LoanReconciliationLink", prisma.loanReconciliationLink.count()],
    ["PropertyTransactionLink", prisma.propertyTransactionLink.count()],
  ].map(async ([name, countPromise]) => [name, await countPromise]));
  return Object.fromEntries(entries);
}

function reportCounts(label, counts) {
  const safeSummary = Object.entries(counts).map(([name, count]) => `${name}=${count}`).join(", ");
  console.log(`${label} aggregate row counts: ${safeSummary}`);
}

async function migrationRows(prisma) {
  return prisma.$queryRaw`
    SELECT "migration_name", "finished_at", "rolled_back_at"
    FROM "_prisma_migrations"
  `;
}

function assertNoFailedMigration(rows) {
  if (rows.some((row) => row.finished_at === null && row.rolled_back_at === null)) {
    fail("FAILED_OR_UNRESOLVED_MIGRATION");
  }
}

async function objectExists(prisma, objectName, kind) {
  if (kind === "table") {
    const rows = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = current_schema() AND c.relname = ${objectName} AND c.relkind = 'r'
      ) AS "exists"
    `;
    return rows[0]?.exists === true;
  }
  const rows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = current_schema() AND t.typname = ${objectName}
    ) AS "exists"
  `;
  return rows[0]?.exists === true;
}

async function runPre(prisma, stateFile) {
  const migrations = await migrationRows(prisma);
  assertNoFailedMigration(migrations);
  if (migrations.some((row) => row.migration_name === EXPECTED_MIGRATION)) fail("TARGET_MIGRATION_ALREADY_PRESENT");
  if (await objectExists(prisma, "PropertyReportReview", "table")) fail("REPORTING_TABLE_ALREADY_PRESENT");
  if (await objectExists(prisma, "PropertyRecordClassification", "type")) fail("REPORTING_ENUM_ALREADY_PRESENT");

  const counts = await existingCounts(prisma);
  await writeFile(stateFile, JSON.stringify(counts), { encoding: "utf8", mode: 0o600 });
  reportCounts("Pre-migration", counts);
  console.log("Pre-migration integrity checks passed: migration state is clear and reporting objects are absent.");
}

async function enumValues(prisma) {
  const rows = await prisma.$queryRaw`
    SELECT e.enumlabel AS "value"
    FROM pg_catalog.pg_enum e
    JOIN pg_catalog.pg_type t ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = current_schema() AND t.typname = 'PropertyRecordClassification'
    ORDER BY e.enumsortorder
  `;
  return rows.map((row) => row.value);
}

async function tableColumns(prisma) {
  const rows = await prisma.$queryRaw`
    SELECT column_name AS "name"
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'PropertyReportReview'
    ORDER BY column_name
  `;
  return rows.map((row) => row.name);
}

async function tableIndexes(prisma) {
  const rows = await prisma.$queryRaw`
    SELECT indexname AS "name"
    FROM pg_catalog.pg_indexes
    WHERE schemaname = current_schema() AND tablename = 'PropertyReportReview'
    ORDER BY indexname
  `;
  return rows.map((row) => row.name);
}

async function tableConstraints(prisma) {
  const rows = await prisma.$queryRaw`
    SELECT c.conname AS "name", c.contype AS "type"
    FROM pg_catalog.pg_constraint c
    JOIN pg_catalog.pg_class r ON r.oid = c.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = current_schema()
      AND r.relname = 'PropertyReportReview'
      AND c.contype IN ('p', 'f')
    ORDER BY c.conname
  `;
  return primaryAndForeignKeyNames(rows);
}

async function beforeCounts(stateFile, expectedCountsJson) {
  if (expectedCountsJson) {
    try {
      return JSON.parse(expectedCountsJson);
    } catch {
      fail("MISSING_PRE_MIGRATION_STATE");
    }
  }
  try {
    return JSON.parse(await readFile(stateFile, "utf8"));
  } catch {
    fail("MISSING_PRE_MIGRATION_STATE");
  }
}

async function runPost(prisma, stateFile, expectedCountsJson) {
  const migrations = await migrationRows(prisma);
  assertNoFailedMigration(migrations);
  const applied = migrations.filter(
    (row) => row.migration_name === EXPECTED_MIGRATION && row.finished_at !== null && row.rolled_back_at === null,
  );
  if (applied.length !== 1) fail("TARGET_MIGRATION_NOT_APPLIED_ONCE");
  if (!equalValues(await enumValues(prisma), EXPECTED_ENUM_VALUES)) fail("REPORTING_ENUM_MISMATCH");
  if (!equalValues(await tableColumns(prisma), EXPECTED_COLUMNS)) fail("REPORTING_COLUMNS_MISMATCH");
  if (!equalValues(await tableIndexes(prisma), EXPECTED_INDEXES)) fail("REPORTING_INDEXES_MISMATCH");
  if (!equalValues(await tableConstraints(prisma), EXPECTED_CONSTRAINTS)) fail("REPORTING_CONSTRAINTS_MISMATCH");
  if (await prisma.propertyReportReview.count() !== 0) fail("REPORTING_TABLE_NOT_EMPTY");

  const baselineCounts = await beforeCounts(stateFile, expectedCountsJson);
  const afterCounts = await existingCounts(prisma);
  if (JSON.stringify(baselineCounts) !== JSON.stringify(afterCounts)) fail("EXISTING_ROW_COUNTS_CHANGED");

  reportCounts("Post-migration", afterCounts);
  console.log("Post-migration integrity checks passed: approved schema is exact, the new table is empty, and existing counts are unchanged.");
}

const prisma = new PrismaClient({ log: [] });

try {
  const { mode, stateFile, expectedCountsJson } = parseArguments();
  if (mode === "pre") await runPre(prisma, stateFile);
  else await runPost(prisma, stateFile, expectedCountsJson);
} catch (error) {
  const code = error instanceof Error && SAFE_FAILURE_CODES.has(error.message) ? error.message : "DATABASE_CHECK_FAILED";
  console.error(`Preview migration integrity check failed: ${code}. No private database details are printed.`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect().catch(() => undefined);
}
