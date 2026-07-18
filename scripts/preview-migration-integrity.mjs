import { readFile, readdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import {
  exactNameSetMatches,
  migrationProfileFor,
  primaryAndForeignKeyNames,
} from "./preview-migration-integrity-core.mjs";
import {
  CONTROLLED_PREVIEW_MIGRATIONS,
  classifyPreMigrationBaseline,
  exactStringSetMatches,
  repositoryMigrationPlan,
} from "./preview-migration-batch-core.mjs";

const MIGRATIONS_DIRECTORY = new URL("../prisma/migrations/", import.meta.url);
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
  "CONTROLLED_MIGRATION_INVENTORY_MISMATCH",
  "FAILED_OR_UNRESOLVED_MIGRATION",
  "UNEXPECTED_MIGRATION_HISTORY",
  "UNEXPECTED_EMPTY_DATABASE_OBJECTS",
  "CONTROLLED_MIGRATION_ALREADY_PRESENT",
  "CONTROLLED_MIGRATION_NOT_APPLIED_ONCE",
  "EXPECTED_TABLE_ALREADY_PRESENT",
  "EXPECTED_ENUM_ALREADY_PRESENT",
  "EXPECTED_COLUMN_ALREADY_PRESENT",
  "EXPECTED_INDEX_ALREADY_PRESENT",
  "AUDIT_ENUM_VALUE_ALREADY_PRESENT",
  "AUDIT_ENUM_VALUE_MISSING",
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
  return actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function parseArguments() {
  const mode = process.argv[2];
  const stateFlag = process.argv.indexOf("--state-file");
  const stateFile = stateFlag >= 0 ? process.argv[stateFlag + 1] : undefined;
  const expectedStateFlag = process.argv.indexOf("--expected-state-json");
  const expectedStateJson = expectedStateFlag >= 0 ? process.argv[expectedStateFlag + 1] : undefined;

  if (
    (mode !== "pre-all" && mode !== "post-all")
    || (mode === "pre-all" && !stateFile)
    || (mode === "post-all" && !stateFile && !expectedStateJson)
  ) {
    fail("INVALID_MODE");
  }
  return { mode, stateFile, expectedStateJson };
}

async function repositoryMigrationNames() {
  const entries = await readdir(MIGRATIONS_DIRECTORY, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && /^\d{14}_[a-z0-9_]+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function migrationTableExists(prisma) {
  const rows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = current_schema()
        AND c.relname = '_prisma_migrations'
        AND c.relkind = 'r'
    ) AS "exists"
  `;
  return rows[0]?.exists === true;
}

async function migrationRows(prisma) {
  return prisma.$queryRaw`
    SELECT "migration_name", "finished_at", "rolled_back_at"
    FROM "_prisma_migrations"
  `;
}

function assertHealthyMigrationRows(rows) {
  if (rows.some((row) => row.finished_at === null || row.rolled_back_at !== null)) {
    fail("FAILED_OR_UNRESOLVED_MIGRATION");
  }
  if (new Set(rows.map((row) => row.migration_name)).size !== rows.length) {
    fail("UNEXPECTED_MIGRATION_HISTORY");
  }
}

async function publicObjectCounts(prisma) {
  const [tableRows, enumRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT COUNT(*)::integer AS "count"
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = current_schema() AND c.relkind IN ('r', 'p')
    `,
    prisma.$queryRaw`
      SELECT COUNT(DISTINCT t.oid)::integer AS "count"
      FROM pg_catalog.pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      JOIN pg_catalog.pg_enum e ON e.enumtypid = t.oid
      WHERE n.nspname = current_schema()
    `,
  ]);
  return {
    publicTableCount: tableRows[0]?.count ?? -1,
    publicEnumCount: enumRows[0]?.count ?? -1,
  };
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

function controlledProfiles() {
  return CONTROLLED_PREVIEW_MIGRATIONS.map((migrationName) => {
    const profile = migrationProfileFor(migrationName);
    if (!profile) fail("UNKNOWN_MIGRATION_PROFILE");
    return profile;
  });
}

function countDelegates(includeControlledTables) {
  const entries = [...EXISTING_COUNT_DELEGATES];
  if (includeControlledTables) {
    for (const profile of controlledProfiles()) {
      for (const [name, table] of Object.entries(profile.tables)) {
        entries.push([name, table.delegate]);
      }
    }
  }
  const unique = new Map(entries.map(([name, delegate]) => [name, delegate]));
  return [...unique.entries()];
}

async function aggregateCounts(prisma, includeControlledTables) {
  const entries = await Promise.all(countDelegates(includeControlledTables).map(async ([name, delegate]) => [
    name,
    await prisma[delegate].count(),
  ]));
  return Object.fromEntries(entries);
}

function reportCounts(label, counts) {
  const safeSummary = Object.entries(counts)
    .map(([name, count]) => `${name}=${count}`)
    .join(", ");
  console.log(`${label} aggregate row counts: ${safeSummary || "none"}`);
}

async function assertControlledObjectsAbsent(prisma, profiles) {
  for (const profile of profiles) {
    for (const tableName of profile.absentTables) {
      if (await objectExists(prisma, tableName, "table")) fail("EXPECTED_TABLE_ALREADY_PRESENT");
    }
    for (const enumName of profile.absentEnums) {
      if (await objectExists(prisma, enumName, "type")) fail("EXPECTED_ENUM_ALREADY_PRESENT");
    }
    for (const [tableName, columnNames] of Object.entries(profile.absentColumns ?? {})) {
      const columns = await tableColumns(prisma, tableName);
      if (columnNames.some((columnName) => columns.includes(columnName))) {
        fail("EXPECTED_COLUMN_ALREADY_PRESENT");
      }
    }
    for (const [tableName, indexNames] of Object.entries(profile.absentIndexes ?? {})) {
      const indexes = await tableIndexes(prisma, tableName);
      if (indexNames.some((indexName) => indexes.includes(indexName))) {
        fail("EXPECTED_INDEX_ALREADY_PRESENT");
      }
    }
    if (profile.auditEntityTypeAdditions.length > 0) {
      const auditValues = await enumValues(prisma, "AuditEntityType");
      if (profile.auditEntityTypeAdditions.some((value) => auditValues.includes(value))) {
        fail("AUDIT_ENUM_VALUE_ALREADY_PRESENT");
      }
    }
  }
}

async function runPreAll(prisma, stateFile) {
  const migrationNames = await repositoryMigrationNames();
  const plan = repositoryMigrationPlan(migrationNames);
  if (!plan) fail("CONTROLLED_MIGRATION_INVENTORY_MISMATCH");

  const hasMigrationTable = await migrationTableExists(prisma);
  const rows = hasMigrationTable ? await migrationRows(prisma) : [];
  if (hasMigrationTable) assertHealthyMigrationRows(rows);
  const objectCounts = await publicObjectCounts(prisma);
  const baseline = classifyPreMigrationBaseline({
    migrationTableExists: hasMigrationTable,
    ...objectCounts,
    appliedMigrationNames: rows.map((row) => row.migration_name),
    earlierMigrationNames: plan.earlierMigrations,
  });
  if (!baseline.ok) fail(baseline.code);

  if (rows.some((row) => CONTROLLED_PREVIEW_MIGRATIONS.includes(row.migration_name))) {
    fail("CONTROLLED_MIGRATION_ALREADY_PRESENT");
  }

  const profiles = controlledProfiles();
  if (baseline.mode === "existing") {
    await assertControlledObjectsAbsent(prisma, profiles);
  }

  const counts = baseline.mode === "existing"
    ? await aggregateCounts(prisma, false)
    : {};
  const state = {
    baseline: baseline.mode,
    counts,
    repositoryMigrations: plan.repositoryMigrations,
    earlierMigrationCount: baseline.earlierMigrationCount,
  };
  await writeFile(stateFile, JSON.stringify(state), { encoding: "utf8", mode: 0o600 });

  reportCounts("Pre-migration", counts);
  console.log(
    `Pre-migration integrity checks passed: ${baseline.earlierMigrationCount} earlier repository migrations are applied; `
    + `${CONTROLLED_PREVIEW_MIGRATIONS.length} controlled migrations are pending; baseline=${baseline.mode}.`,
  );
}

async function readState(stateFile, expectedStateJson) {
  if (expectedStateJson) {
    try {
      return JSON.parse(expectedStateJson);
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

async function validateProfilePost(prisma, profile) {
  for (const [enumName, expectedValues] of Object.entries(profile.enums)) {
    if (!equalValues(await enumValues(prisma, enumName), expectedValues)) {
      fail("EXPECTED_ENUM_MISMATCH");
    }
  }
  if (profile.auditEntityTypeAdditions.length > 0) {
    const auditValues = await enumValues(prisma, "AuditEntityType");
    if (profile.auditEntityTypeAdditions.some((value) => !auditValues.includes(value))) {
      fail("AUDIT_ENUM_VALUE_MISSING");
    }
  }
  for (const [tableName, columnNames] of Object.entries(profile.requiredColumns ?? {})) {
    const columns = await tableColumns(prisma, tableName);
    if (columnNames.some((columnName) => !columns.includes(columnName))) {
      fail("EXPECTED_COLUMNS_MISMATCH");
    }
  }
  for (const [tableName, indexNames] of Object.entries(profile.requiredIndexes ?? {})) {
    const indexes = await tableIndexes(prisma, tableName);
    if (indexNames.some((indexName) => !indexes.includes(indexName))) {
      fail("EXPECTED_INDEXES_MISMATCH");
    }
  }
  for (const [tableName, expected] of Object.entries(profile.tables)) {
    if (!equalValues(await tableColumns(prisma, tableName), expected.columns)) {
      fail("EXPECTED_COLUMNS_MISMATCH");
    }
    if (!exactNameSetMatches(await tableIndexes(prisma, tableName), expected.indexes)) {
      fail("EXPECTED_INDEXES_MISMATCH");
    }
    if (!equalValues(await tableConstraints(prisma, tableName), expected.constraints)) {
      fail("EXPECTED_CONSTRAINTS_MISMATCH");
    }
    if (await prisma[expected.delegate].count() !== 0) {
      fail("EXPECTED_TABLE_NOT_EMPTY");
    }
  }
}

async function runPostAll(prisma, stateFile, expectedStateJson) {
  const migrationNames = await repositoryMigrationNames();
  const plan = repositoryMigrationPlan(migrationNames);
  if (!plan) fail("CONTROLLED_MIGRATION_INVENTORY_MISMATCH");

  if (!(await migrationTableExists(prisma))) fail("UNEXPECTED_MIGRATION_HISTORY");
  const rows = await migrationRows(prisma);
  assertHealthyMigrationRows(rows);
  const appliedNames = rows.map((row) => row.migration_name);
  if (!exactStringSetMatches(appliedNames, plan.repositoryMigrations)) {
    fail("UNEXPECTED_MIGRATION_HISTORY");
  }
  for (const migrationName of CONTROLLED_PREVIEW_MIGRATIONS) {
    if (appliedNames.filter((name) => name === migrationName).length !== 1) {
      fail("CONTROLLED_MIGRATION_NOT_APPLIED_ONCE");
    }
  }

  for (const profile of controlledProfiles()) {
    await validateProfilePost(prisma, profile);
  }

  const state = await readState(stateFile, expectedStateJson);
  if (
    !state
    || !["empty", "existing"].includes(state.baseline)
    || !exactStringSetMatches(state.repositoryMigrations ?? [], plan.repositoryMigrations)
  ) {
    fail("MISSING_PRE_MIGRATION_STATE");
  }

  const afterCounts = await aggregateCounts(prisma, true);
  if (state.baseline === "empty") {
    if (Object.values(afterCounts).some((count) => count !== 0)) {
      fail("EXISTING_ROW_COUNTS_CHANGED");
    }
  } else {
    const baselineCounts = state.counts ?? {};
    if (
      Object.keys(baselineCounts).length === 0
      || Object.entries(baselineCounts).some(([name, count]) => afterCounts[name] !== count)
    ) {
      fail("EXISTING_ROW_COUNTS_CHANGED");
    }
  }

  reportCounts("Post-migration", afterCounts);
  console.log(
    `Post-migration integrity checks passed: all ${plan.repositoryMigrations.length} repository migrations are healthy, `
    + "all six controlled migration profiles are exact, new tables are empty, and aggregate counts are unchanged.",
  );
}

const prisma = new PrismaClient({ log: [] });

try {
  const { mode, stateFile, expectedStateJson } = parseArguments();
  if (mode === "pre-all") await runPreAll(prisma, stateFile);
  else await runPostAll(prisma, stateFile, expectedStateJson);
} catch (error) {
  const code = error instanceof Error && SAFE_FAILURE_CODES.has(error.message)
    ? error.message
    : "DATABASE_CHECK_FAILED";
  console.error(`Preview migration integrity check failed: ${code}. No private database details are printed.`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect().catch(() => undefined);
}
