import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  DocumentConflictError,
  DocumentProviderUnavailableError,
  DocumentsUnavailableError,
  MAX_DOCUMENT_SIZE_BYTES,
  documentPreparationSchema,
  listDocuments,
  mutateDocumentMetadata,
  prepareDocumentUpload,
  type DocumentRecord,
  type DocumentStorageAdapter,
  type DocumentStore,
} from "@/src/server/documents";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/documents.ts", import.meta.url);
const now = new Date("2026-07-17T12:00:00.000Z");

function document(userId = "user_1"): DocumentRecord {
  return {
    id: "document_1",
    userId,
    displayName: "Council rates receipt",
    category: "RECEIPT",
    status: "PENDING_UPLOAD",
    contentType: "application/pdf",
    sizeBytes: 1024,
    checksumSha256: null,
    storageProvider: "test-private",
    objectKey: "documents/private-object",
    documentDate: null,
    financialYear: "2026-27",
    deletedAt: null,
    links: [],
  };
}

function memoryStore(overrides: Partial<DocumentStore> = {}) {
  const calls: Array<Record<string, unknown>> = [];
  const store: DocumentStore = {
    async list(userId) {
      calls.push({ action: "list", userId });
      return [document(userId)];
    },
    async createMetadata(userId, input) {
      calls.push({ action: "create-metadata", userId, input });
      return { ...document(userId), ...input, sizeBytes: 0, storageProvider: null, objectKey: null };
    },
    async createPending(userId, input) {
      calls.push({ action: "create", userId, input });
      return { ...document(userId), ...input };
    },
    async addLink(userId, documentId, targetType, targetKey, targetEntityId) {
      calls.push({ action: "link", userId, documentId, targetType, targetKey, targetEntityId });
      return document(userId);
    },
    async revokeLink(userId, documentId, linkId) {
      calls.push({ action: "unlink", userId, documentId, linkId });
      return document(userId);
    },
    async softDelete(userId, documentId) {
      calls.push({ action: "delete", userId, documentId });
      return "PROVIDER_CLEANUP" as const;
    },
    ...overrides,
  };
  return { store, calls };
}

const adapter: DocumentStorageAdapter = {
  code: "test-private",
  async prepareUpload() {
    return { uploadAuthorization: "one-time-upload-authorization" };
  },
};

describe("Phase 11 guarded document metadata service", () => {
  it("fails closed before authentication, provider or store access", async () => {
    const list = vi.fn();
    const { store } = memoryStore({ list });

    await expect(listDocuments(createTestUserContext("user_1"), store))
      .rejects.toBeInstanceOf(DocumentsUnavailableError);
    expect(list).not.toHaveBeenCalled();
  });

  it("creates metadata without an object key, storage provider or file bytes", async () => {
    const { store, calls } = memoryStore();
    const result = await mutateDocumentMetadata(
      createTestUserContext("user_4"),
      {
        action: "CREATE_METADATA",
        displayName: "  Synthetic receipt ",
        category: "RECEIPT",
        contentType: "application/pdf",
        documentDate: "2026-07-19",
        financialYear: "2026-27",
      },
      store,
      now,
      { runtimeEnabled: true },
    );
    expect(calls[0]).toMatchObject({
      action: "create-metadata",
      userId: "user_4",
      input: {
        displayName: "Synthetic receipt",
        storageProvider: undefined,
        objectKey: undefined,
      },
    });
    expect(result.type).toBe("DOCUMENT");
    if (result.type !== "DOCUMENT") throw new Error("Expected document metadata.");
    expect(result.document.sizeBytes).toBe(0);
  });

  it("keeps upload unavailable even when the schema runtime is test-enabled", async () => {
    const prepareUpload = vi.fn();
    const { store } = memoryStore();
    await expect(prepareDocumentUpload(
      createTestUserContext("user_1"),
      {
        displayName: "Receipt",
        category: "RECEIPT",
        contentType: "application/pdf",
        sizeBytes: 1024,
        documentDate: null,
        financialYear: null,
      },
      { code: "disabled", prepareUpload },
      store,
      now,
      { runtimeEnabled: true },
    )).rejects.toBeInstanceOf(DocumentProviderUnavailableError);
    expect(prepareUpload).not.toHaveBeenCalled();
  });

  it("passes only opaque object metadata to an explicitly enabled adapter", async () => {
    const prepareUpload = vi.fn(async (_input: {
      objectKey: string;
      contentType: string;
      sizeBytes: number;
    }) => ({
      uploadAuthorization: "one-time-upload-authorization",
    }));
    const { store, calls } = memoryStore();
    const result = await prepareDocumentUpload(
      createTestUserContext("user_7"),
      {
        displayName: "  Council   rates receipt ",
        category: "RECEIPT",
        contentType: "application/pdf",
        sizeBytes: 1024,
        documentDate: "2026-07-17",
        financialYear: "2026-27",
      },
      { code: "test-private", prepareUpload },
      store,
      now,
      { runtimeEnabled: true, providerEnabled: true },
    );

    expect(prepareUpload).toHaveBeenCalledOnce();
    const providerInput = prepareUpload.mock.calls[0]?.[0];
    if (!providerInput) throw new Error("Expected safe provider input.");
    expect(providerInput.objectKey).toMatch(/^documents\/[a-f0-9]{48}$/);
    expect(providerInput).toEqual({
      objectKey: providerInput.objectKey,
      contentType: "application/pdf",
      sizeBytes: 1024,
    });
    expect(JSON.stringify(providerInput)).not.toContain("Council");
    expect(calls[0]).toMatchObject({
      action: "create",
      userId: "user_7",
      input: {
        displayName: "Council rates receipt",
        storageProvider: "test-private",
        objectKey: providerInput.objectKey,
      },
    });
    expect(result.uploadAuthorization).toBe("one-time-upload-authorization");
    expect(JSON.stringify(result.document)).not.toContain(providerInput.objectKey);
    expect(JSON.stringify(result.document)).not.toContain("test-private");
  });

  it("accepts only the contracted types, size and safe label policy", () => {
    const base = {
      displayName: "Receipt",
      category: "RECEIPT",
      contentType: "application/pdf",
      sizeBytes: 1,
      documentDate: null,
      financialYear: null,
    };
    expect(documentPreparationSchema.safeParse(base).success).toBe(true);
    expect(documentPreparationSchema.safeParse({
      ...base,
      contentType: "text/html",
    }).success).toBe(false);
    expect(documentPreparationSchema.safeParse({
      ...base,
      sizeBytes: MAX_DOCUMENT_SIZE_BYTES + 1,
    }).success).toBe(false);
    expect(documentPreparationSchema.safeParse({
      ...base,
      displayName: "../private.csv",
    }).success).toBe(false);
  });

  it("keeps record links explicitly owner scoped", async () => {
    const { store, calls } = memoryStore();
    await mutateDocumentMetadata(
      createTestUserContext("user_8"),
      {
        action: "LINK",
        documentId: "document_1",
        targetType: "TRANSACTION",
        targetEntityId: "transaction_1",
      },
      store,
      now,
      { runtimeEnabled: true },
    );

    expect(calls).toEqual([{
      action: "link",
      userId: "user_8",
      documentId: "document_1",
      targetType: "TRANSACTION",
      targetKey: "TRANSACTION:transaction_1",
      targetEntityId: "transaction_1",
    }]);
  });

  it("uses a fixed report key and Australian financial-year format", async () => {
    const { store, calls } = memoryStore();
    await mutateDocumentMetadata(
      createTestUserContext("user_1"),
      {
        action: "LINK",
        documentId: "document_1",
        targetType: "FINANCIAL_YEAR",
        targetKey: "2026-27",
      },
      store,
      now,
      { runtimeEnabled: true },
    );
    expect(calls[0]).toMatchObject({
      targetType: "FINANCIAL_YEAR",
      targetKey: "2026-27",
      targetEntityId: null,
    });
  });

  it("revokes normal access immediately while reporting provider cleanup honestly", async () => {
    const { store, calls } = memoryStore();
    const result = await mutateDocumentMetadata(
      createTestUserContext("user_2"),
      { action: "DELETE", documentId: "document_1" },
      store,
      now,
      { runtimeEnabled: true },
    );
    expect(calls).toEqual([{ action: "delete", userId: "user_2", documentId: "document_1" }]);
    expect(result).toEqual({ type: "DELETED", providerCleanupRequired: true });
  });

  it("fails safely for another-user, stale or missing metadata", async () => {
    const { store } = memoryStore({
      async addLink() {
        return null;
      },
    });
    await expect(mutateDocumentMetadata(
      createTestUserContext("user_9"),
      {
        action: "LINK",
        documentId: "document_1",
        targetType: "PROPERTY",
        targetEntityId: "property_1",
      },
      store,
      now,
      { runtimeEnabled: true },
    )).rejects.toBeInstanceOf(DocumentConflictError);
  });

  it("contains no file bytes, OCR, public URL, provider SDK or private-source logging", async () => {
    const service = await readFile(servicePath, "utf8");
    expect(service).toContain("isVerifiedPreviewRuntime()");
    expect(service).not.toContain("PHASE_11_DOCUMENTS_RUNTIME_ENABLED");
    expect(service).not.toMatch(/console\.(?:log|info|warn|error)/);
    expect(service).not.toContain("localStorage");
    expect(service).not.toContain("rawCsv");
    expect(service).not.toContain("fileBytes");
    expect(service).not.toContain("ocrText");
    expect(service).not.toContain("publicUrl");
    expect(service).not.toContain("@vercel/blob");
    expect(service).not.toContain("accountNumber");
    expect(service).not.toContain("filename");
  });
});
