import { readFile, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import {
  exactNameSetMatches,
  migrationProfileFor,
  primaryAndForeignKeyNames,
} from "./preview-migration-integrity-core.mjs";

const DEFAULT_MIGRATION = "20260717090000_phase_6_bulk_operation_foundation";
const EXISTING_COUNT_DELEGATES = [
  ["User", "user"],
  ["Category", "category"],
  ["Transaction", "transaction"],
  ["ImportBatch", "importBatch"],
  ["ImportRow", "importRow"],
  ["Property", "property"],
  ["LoanAccount", "loanAccount"],
  ["LoanRepayment", "loanRepayment"],
  ["LoanReconciliationLink", "loanReconciliationLink"],
  ["PropertyTransactionLink", "propertyTransactionLink"],
  ["PropertyReportReview", "propertyReportReview"],
  ["RecurringItem", "recurringItem"],
  ["RecurringSuggestionDismissal", "recurringSuggestionDismissal"],
  ["CategoryBudget", "categoryBudget"],
];
const SAFE_FAILURE_CODES = new Set([
  "AUDIT_ENUM_VALUE_ALREADY_PRESENT",
  "AUDIT_ENUM_VALUE_MISSING",
  "FAILED_OR_UNRESOLVED_MIGRATION",
  "TARGET_MIGRATION_ALREADY_PRESENT",
  "TARGET_MIGRATION_NOT_APPLIED_ONCE",
  "EXPECTED_TABLE_ALREADY_PRESENT",
  "EXPECTED_ENUM_ALREADY_PRESENT",
  "EXPECTED_ENUM_MISMATCH",
  "EXPECTED_COLUMNS_MISMATCH",
  "EXPECTED_INDEXES_MISMATCH",
  "EXPECTED_CONSTRAINTS_MISMATCH",
  "EXPECTED_TABLE_NOT_EMPTY",
  "EXISTING_ROW_COUNTS_CHANGED",
  "MISSING_PRE_MIGRATION_STATE",
  "UNKNOWN_MIGRATION_PROFILE",
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
  const migrationFlag = process.argv.indexOf("--migration");
  const migrationName = migrationFlag >= 0
    ? process.argv[migrationFlag + 1]
    : process.env.PREVIEW_MIGRATION_NAME || DEFAULT_MIGRATION;
  if ((mode !== "pre" && mode !== "post") || (mode === "pre" && !stateFile) || (mode === "post" && !stateFile && !expectedCountsJson)) {
    fail("INVALID_MODE");
  }
  const profile = migrationProfileFor(migrationName);
  if (!profile) fail("UNKNOWN_MIGRATION_PROFILE");
  return { mode, stateFile, expectedCountsJson, profile };
}

async function existingCounts(prisma, profile) {
  const delegates = [
    ...EXISTING_COUNT_DELEGATES,
    ...(profile.existingCountDelegates ?? []),
  ];
  const entries = await Promise.all(delegates.map(async ([name, delegate]) => [
    name,
    await prisma[delegate].count(),
  ]));
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

async function enumValues(prisma, enumName) {
  const rows = await prisma.$queryRaw`
    SELECT e.enumlabel AS "value"
    FROM pg_catalog.pg_enum e
    JOIN pg_catalog.pg_type t ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = current_schema() AND t.typname = ${enumName}
    ORDER BY e.enumsortorder
  `;
  return rows.map((row) => row.value);
}

async function runPre(prisma, stateFile, profile) {
  const migrations = await migrationRows(prisma);
  assertNoFailedMigration(migrations);
  if (migrations.some((row) => row.migration_name === profile.migrationName)) fail("TARGET_MIGRATION_ALREADY_PRESENT");
  for (const tableName of profile.absentTables) {
    if (await objectExists(prisma, tableName, "table")) fail("EXPECTED_TABLE_ALREADY_PRESENT");
  }
  for (const enumName of profile.absentEnums) {
    if (await objectExists(prisma, enumName, "type")) fail("EXPECTED_ENUM_ALREADY_PRESENT");
  }
  if (profile.auditEntityTypeAdditions.length > 0) {
    const auditValues = await enumValues(prisma, "AuditEntityType");
    if (profile.auditEntityTypeAdditions.some((value) => auditValues.includes(value))) {
      fail("AUDIT_ENUM_VALUE_ALREADY_PRESENT");
    }
  }

  const counts = await existingCounts(prisma, profile);
  await writeFile(stateFile, JSON.stringify(counts), { encoding: "utf8", mode: 0o600 });
  reportCounts("Pre-migration", counts);
  console.log(`Pre-migration integrity checks passed for ${profile.migrationName}: migration state is clear and expected objects are absent.`);
}

async function tableColumns(prisma, tableName) {
  const rows = await prisma.$queryRaw`
    SELECT column_name AS "name"
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = ${tableName}
    ORDER BY column_name
  `;
  return rows.map((row) => row.name);
}

async function tableIndexes(prisma, tableName) {
  const rows = await prisma.$queryRaw`
    SELECT indexname AS "name"
    FROM pg_catalog.pg_indexes
    WHERE schemaname = current_schema() AND tablename = ${tableName}
    ORDER BY indexname
  `;
  return rows.map((row) => row.name);
}

async function tableConstraints(prisma, tableName) {
  const rows = await prisma.$queryRaw`
    SELECT c.conname AS "name", c.contype AS "type"
    FROM pg_catalog.pg_constraint c
    JOIN pg_catalog.pg_class r ON r.oid = c.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = current_schema()
      AND r.relname = ${tableName}
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

function assertCountsUnchanged(baselineCounts, afterCounts) {
  const comparedNames = Object.keys(baselineCounts);
  if (comparedNames.length === 0) fail("MISSING_PRE_MIGRATION_STATE");
  const changed = comparedNames.some((name) => baselineCounts[name] !== afterCounts[name]);
  if (changed) fail("EXISTING_ROW_COUNTS_CHANGED");
}

async function runPost(prisma, stateFile, expectedCountsJson, profile) {
  const migrations = await migrationRows(prisma);
  assertNoFailedMigration(migrations);
  const applied = migrations.filter(
    (row) => row.migration_name === profile.migrationName && row.finished_at !== null && row.rolled_back_at === null,
  );
  if (applied.length !== 1) fail("TARGET_MIGRATION_NOT_APPLIED_ONCE");
  for (const [enumName, expectedValues] of Object.entries(profile.enums)) {
    if (!equalValues(await enumValues(prisma, enumName), expectedValues)) fail("EXPECTED_ENUM_MISMATCH");
  }
  if (profile.auditEntityTypeAdditions.length > 0) {
    const auditValues = await enumValues(prisma, "AuditEntityType");
    if (profile.auditEntityTypeAdditions.some((value) => !auditValues.includes(value))) {
      fail("AUDIT_ENUM_VALUE_MISSING");
    }
  }
  for (const [tableName, expected] of Object.entries(profile.tables)) {
    if (!equalValues(await tableColumns(prisma, tableName), expected.columns)) fail("EXPECTED_COLUMNS_MISMATCH");
    if (!exactNameSetMatches(await tableIndexes(prisma, tableName), expected.indexes)) fail("EXPECTED_INDEXES_MISMATCH");
    if (!equalValues(await tableConstraints(prisma, tableName), expected.constraints)) fail("EXPECTED_CONSTRAINTS_MISMATCH");
    if (await prisma[expected.delegate].count() !== 0) fail("EXPECTED_TABLE_NOT_EMPTY");
  }

  const baselineCounts = await beforeCounts(stateFile, expectedCountsJson);
  const afterCounts = await existingCounts(prisma, profile);
  assertCountsUnchanged(baselineCounts, afterCounts);

  reportCounts("Post-migration", afterCounts);
  console.log(`Post-migration integrity checks passed for ${profile.migrationName}: approved schema is exact, new tables are empty, and existing counts are unchanged.`);
}

const prisma = new PrismaClient({ log: [] });

try {
  const { mode, stateFile, expectedCountsJson, profile } = parseArguments();
  if (mode === "pre") await runPre(prisma, stateFile, profile);
  else await runPost(prisma, stateFile, expectedCountsJson, profile);
} catch (error) {
  const code = error instanceof Error && SAFE_FAILURE_CODES.has(error.message) ? error.message : "DATABASE_CHECK_FAILED";
  console.error(`Preview migration integrity check failed: ${code}. No private database details are printed.`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect().catch(() => undefined);
}
