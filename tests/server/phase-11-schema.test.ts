import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PHASE_11_DOCUMENTS_RUNTIME_ENABLED,
  requirePhase11DocumentsRuntime,
} from "@/src/server/phase-11-runtime";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync(
  "prisma/migrations/20260717140000_phase_11_document_metadata_foundation/migration.sql",
  "utf8",
);

describe("Phase 11 document metadata schema foundation", () => {
  it("fails closed before any document table or provider access", () => {
    expect(PHASE_11_DOCUMENTS_RUNTIME_ENABLED).toBe(false);
    expect(() => requirePhase11DocumentsRuntime())
      .toThrow("PHASE_11_DOCUMENTS_NOT_AVAILABLE");
  });

  it("adds only metadata and link models with approved lifecycle enums", () => {
    expect(schema).toContain("model Document {");
    expect(schema).toContain("model DocumentLink {");
    expect(migration).toContain('CREATE TABLE "Document"');
    expect(migration).toContain('CREATE TABLE "DocumentLink"');
    for (const value of [
      "PENDING_UPLOAD", "QUARANTINED", "AVAILABLE", "FAILED", "DELETED",
      "RECEIPT", "INVOICE", "LOAN_STATEMENT", "PROPERTY_RECORD",
      "REPORT_EVIDENCE", "OTHER",
    ]) {
      expect(schema).toContain(value);
      expect(migration).toContain(value);
    }
  });

  it("stores no file bytes, OCR text, raw filename or public URL", () => {
    expect(schema).not.toMatch(/fileBytes|binaryData|ocrText|extractedText|originalFilename|publicUrl/);
    expect(migration).not.toMatch(/fileBytes|binaryData|ocrText|extractedText|originalFilename|publicUrl/i);
    expect(schema).toContain("storageProvider   String?");
    expect(schema).toContain("objectKey         String?");
    expect(schema).toContain("@@unique([storageProvider, objectKey])");
  });

  it("keeps links owner constrained and does not alter financial source tables", () => {
    expect(schema).toContain("@@unique([documentId, targetType, targetKey])");
    expect(schema).toContain("@@index([userId, revokedAt, targetType])");
    expect(migration).not.toMatch(/ALTER TABLE "(?:Transaction|Property|LoanAccount|LoanRepayment|ImportBatch)"/);
    expect(migration).not.toMatch(/UPDATE\s+"|DELETE\s+FROM|DROP\s+(?:TABLE|COLUMN|TYPE)/i);
  });

  it("adds safe audit values without finance or provider payload fields", () => {
    expect(schema).toContain("DOCUMENT");
    expect(schema).toContain("DOCUMENT_LINK");
    expect(migration).toContain("'DOCUMENT'");
    expect(migration).toContain("'DOCUMENT_LINK'");
    expect(migration).not.toMatch(/amountCents|rawNarration|accountNumber|bsb|filename|merchantName|exactAddress|providerToken/i);
  });
});
