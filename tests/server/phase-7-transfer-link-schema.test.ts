import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const schemaPath = new URL("../../prisma/schema.prisma", import.meta.url);
const migrationPath = new URL(
  "../../prisma/migrations/20260717100000_phase_7_transfer_link_foundation/migration.sql",
  import.meta.url,
);
const contractPath = new URL("../../docs/PHASE_7_TRANSFER_LINK_CONTRACT.md", import.meta.url);
const packagePath = new URL("../../package.json", import.meta.url);
const lockPath = new URL("../../package-lock.json", import.meta.url);

describe("Phase 7 durable transfer-link schema foundation", () => {
  it("defines only the contracted owner-scoped lifecycle model", async () => {
    const schema = await readFile(schemaPath, "utf8");
    const transferModel = schema.match(/model TransferLink \{[\s\S]*?\n\}/)?.[0] ?? "";

    expect(schema).toContain("TRANSFER_LINK");
    expect(schema).toContain("transferLinks                TransferLink[]");
    expect(schema).toContain('outgoingTransferLinks    TransferLink[]            @relation("OutgoingTransferTransaction")');
    expect(schema).toContain('incomingTransferLinks    TransferLink[]            @relation("IncomingTransferTransaction")');
    expect(transferModel).toContain("userId");
    expect(transferModel).toContain("outgoingTransactionId");
    expect(transferModel).toContain("incomingTransactionId");
    expect(transferModel).toContain("confirmedAt");
    expect(transferModel).toContain("unlinkedAt");
    expect(transferModel).not.toMatch(/amount|description|merchant|filename|account|bsb|balance/i);
  });

  it("uses active-only uniqueness, distinct roles and approved ownership foreign keys", async () => {
    const migration = await readFile(migrationPath, "utf8");

    expect(migration).toContain('"TransferLink_outgoingTransactionId_active_key"');
    expect(migration).toContain('"TransferLink_incomingTransactionId_active_key"');
    expect(migration.match(/WHERE "unlinkedAt" IS NULL/g)).toHaveLength(2);
    expect(migration).toContain('"TransferLink_distinct_transactions_check"');
    expect(migration).toContain('CHECK ("outgoingTransactionId" <> "incomingTransactionId")');
    expect(migration).toContain('REFERENCES "User"("id")\nON DELETE CASCADE');
    expect(migration.match(/REFERENCES "Transaction"\("id"\)\nON DELETE RESTRICT/g)).toHaveLength(2);
  });

  it("is additive, empty-table-only SQL with no rewrite or destructive operation", async () => {
    const migration = await readFile(migrationPath, "utf8");

    expect(migration).toContain('CREATE TABLE "TransferLink"');
    expect(migration).toContain("ALTER TYPE \"AuditEntityType\" ADD VALUE 'TRANSFER_LINK'");
    expect(migration).not.toMatch(/^\\s*(?:INSERT INTO|UPDATE\\s+"|DELETE FROM|DROP |TRUNCATE|ALTER COLUMN)/im);
  });

  it("keeps financial and privacy boundaries explicit in the contract", async () => {
    const contract = await readFile(contractPath, "utf8");

    expect(contract).toContain("Both existing transactions remain the only cashflow records.");
    expect(contract).toContain("exact opposites in integer cents");
    expect(contract).toContain("explicit user confirmation");
    expect(contract).toContain("Split parents and children are excluded");
    expect(contract).toContain("Do not persist or log descriptions");
    expect(contract).toContain("No schema or migration file is authorised by this document while the isolated Preview Neon destination is unresolved.");
  });

  it("does not change packages or the lockfile contract", async () => {
    const [packageJson, lockfile] = await Promise.all([
      readFile(packagePath, "utf8"),
      readFile(lockPath, "utf8"),
    ]);
    expect(JSON.parse(packageJson).name).toBe("spendgrove");
    expect(JSON.parse(lockfile).name).toBe("spendgrove");
  });
});
