import { describe, expect, it } from "vitest";
import { validatePreviewConnectionIdentity } from "../../scripts/preview-database-identity-core.mjs";

const expected = {
  expectedPooledHost: "preview-pooler.example.neon.tech",
  expectedDirectHost: "preview.example.neon.tech",
  expectedDatabase: "neondb",
};

function connection(host, database = "neondb", password = "synthetic-password") {
  return `postgresql://preview-role:${password}@${host}/${database}?sslmode=require`;
}

describe("Preview database identity validation", () => {
  it("accepts matching pooled and direct identities", () => {
    expect(validatePreviewConnectionIdentity({
      databaseUrl: connection("preview-pooler.example.neon.tech"),
      directDatabaseUrl: connection("preview.example.neon.tech"),
      ...expected,
    })).toEqual({ ok: true, code: "PREVIEW_DATABASE_IDENTITY_CONFIRMED" });
  });

  it("rejects a different host or database", () => {
    expect(validatePreviewConnectionIdentity({
      databaseUrl: connection("production-pooler.example.neon.tech"),
      directDatabaseUrl: connection("preview.example.neon.tech"),
      ...expected,
    }).ok).toBe(false);
    expect(validatePreviewConnectionIdentity({
      databaseUrl: connection("preview-pooler.example.neon.tech", "otherdb"),
      directDatabaseUrl: connection("preview.example.neon.tech"),
      ...expected,
    }).ok).toBe(false);
  });

  it("rejects pooled/direct reversal, credential mismatch and missing TLS requirement", () => {
    expect(validatePreviewConnectionIdentity({
      databaseUrl: connection("preview.example.neon.tech"),
      directDatabaseUrl: connection("preview-pooler.example.neon.tech"),
      ...expected,
    }).ok).toBe(false);
    expect(validatePreviewConnectionIdentity({
      databaseUrl: connection("preview-pooler.example.neon.tech"),
      directDatabaseUrl: connection("preview.example.neon.tech", "neondb", "different"),
      ...expected,
    }).ok).toBe(false);
    expect(validatePreviewConnectionIdentity({
      databaseUrl: "postgresql://preview-role:synthetic-password@preview-pooler.example.neon.tech/neondb",
      directDatabaseUrl: connection("preview.example.neon.tech"),
      ...expected,
    }).ok).toBe(false);
  });
});
