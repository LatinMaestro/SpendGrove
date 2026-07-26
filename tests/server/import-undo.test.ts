import { readFile } from "node:fs/promises";
import type { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getImportUndoStatus, ImportUndoUnavailableError } from "@/src/server/import-undo";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/import-undo.ts", import.meta.url);
const commitPath = new URL("../../src/server/import-commit.ts", import.meta.url);

const originalVercelEnv = process.env.VERCEL_ENV;
const originalVitestEnv = process.env.VITEST;

afterEach(() => {
  vi.restoreAllMocks();
  if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnv;
  if (originalVitestEnv === undefined) delete process.env.VITEST;
  else process.env.VITEST = originalVitestEnv;
});

function preview() {
  process.env.VITEST = "false";
  process.env.VERCEL_ENV = "preview";
}

function prismaWithBatch(batch: unknown) {
  const findFirst = vi.fn(async () => batch);
  return {
    prisma: { importBatch: { findFirst } } as unknown as PrismaClient,
    findFirst,
  };
}

function eligibleBatch(overrides: Record<string, unknown> = {}) {
  return {
    id: "batch_1",
    userId: "user_1",
    type: "TRANSACTION_CSV",
    status: "COMPLETED",
    deletedAt: null,
    importRows: [{
      id: "row_1",
      action: "IMPORT",
      committedTransactionId: "transaction_1",
      committedTransactionUpdatedAt: new Date("2026-07-19T00:00:00.000Z"),
    }],
    undoOperation: null,
    ...overrides,
  };
}

describe("Preview import undo boundary", () => {
  it("fails before database access outside verified Preview", async () => {
    process.env.VERCEL_ENV = "production";
    const { prisma, findFirst } = prismaWithBatch(eligibleBatch());
    await expect(getImportUndoStatus(createTestUserContext("user_1"), "batch_1", prisma))
      .rejects.toBeInstanceOf(ImportUndoUnavailableError);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("marks only new versioned everyday imports eligible", async () => {
    preview();
    const current = prismaWithBatch(eligibleBatch());
    await expect(getImportUndoStatus(createTestUserContext("user_1"), "batch_1", current.prisma))
      .resolves.toMatchObject({ available: true, eligible: true, operationId: null, canRestore: false });

    const legacy = prismaWithBatch(eligibleBatch({
      importRows: [{
        id: "row_1",
        action: "IMPORT",
        committedTransactionId: "transaction_1",
        committedTransactionUpdatedAt: null,
      }],
    }));
    await expect(getImportUndoStatus(createTestUserContext("user_1"), "batch_1", legacy.prisma))
      .resolves.toMatchObject({ eligible: false, message: expect.stringContaining("cannot be undone safely") });
  });

  it("exposes safe aggregate lifecycle state and restore availability", async () => {
    preview();
    const { prisma } = prismaWithBatch(eligibleBatch({
      undoOperation: {
        id: "undo_1",
        status: "PARTIAL",
        requestedCount: 4,
        undoneCount: 2,
        noChangeCount: 1,
        blockedCount: 1,
        failedCount: 0,
        restoredCount: 0,
        restoreBlockedCount: 0,
      },
    }));
    await expect(getImportUndoStatus(createTestUserContext("user_1"), "batch_1", prisma))
      .resolves.toMatchObject({
        eligible: false,
        operationId: "undo_1",
        status: "PARTIAL",
        undoneCount: 2,
        blockedCount: 1,
        canRestore: true,
      });
  });

  it("keeps ownership checks and every approved dependency guard in the server service", async () => {
    const service = await readFile(servicePath, "utf8");
    expect(service).toContain('where: { id: batchId, userId }');
    expect(service).toContain("committedTransactionUpdatedAt");
    expect(service).toContain('"ACTIVE_LOAN_RECONCILIATION"');
    expect(service).toContain('"ACTIVE_TRANSFER_LINK"');
    expect(service).toContain('"PROPERTY_REVIEW_EXISTS"');
    expect(service).toContain('"PROPERTY_STATE_CHANGED"');
    expect(service).toContain('"BULK_OPERATION_DEPENDENCY"');
    expect(service).toContain('splitRole: "NONE"');
    expect(service).toContain('source: "IMPORTED"');
    expect(service).toContain('status: "DELETED"');
    expect(service).toContain('status: "ACTIVE"');
    expect(service).not.toMatch(/description|merchantName|amountCents|fileName|accountReference|bsb/i);
  });

  it("versions only new Preview IMPORT rows without backfilling old imports", async () => {
    const commit = await readFile(commitPath, "utf8");
    expect(commit).toContain("const importUndoAvailable = isVerifiedPreviewRuntime()");
    expect(commit).toContain("committedTransactionUpdatedAt: now");
    expect(commit).toContain("...(importUndoAvailable ?");
    expect(commit).not.toMatch(/importRow\.updateMany|committedTransactionUpdatedAt:\s*\{\s*set/);
  });
});
