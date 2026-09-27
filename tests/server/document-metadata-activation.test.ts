import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  DocumentLinkCandidatesUnavailableError,
  listDocumentLinkCandidates,
  type DocumentLinkCandidateStore,
} from "@/src/server/document-link-candidates";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const componentPath = new URL("../../components/document-metadata.tsx", import.meta.url);
const routePath = new URL("../../app/api/account/documents/route.ts", import.meta.url);
const settingsPath = new URL("../../app/settings/page.tsx", import.meta.url);
const servicePath = new URL("../../src/server/documents.ts", import.meta.url);
const candidatesPath = new URL("../../src/server/document-link-candidates.ts", import.meta.url);
const exportPath = new URL("../../src/server/account-export.ts", import.meta.url);
const deletionPath = new URL("../../src/server/account-deletion.ts", import.meta.url);
const schemaPath = new URL("../../prisma/schema.prisma", import.meta.url);

function store(overrides: Partial<DocumentLinkCandidateStore> = {}) {
  const userIds: string[] = [];
  const value: DocumentLinkCandidateStore = {
    async list(userId) {
      userIds.push(userId);
      return [{
        targetType: "PROPERTY",
        targetKey: "PROPERTY:property_1",
        targetEntityId: "property_1",
        title: "Synthetic property",
        detail: "Property",
      }];
    },
    ...overrides,
  };
  return { value, userIds };
}

describe("Preview document metadata activation", () => {
  it("fails closed before candidate access outside verified Preview", async () => {
    const list = vi.fn();
    const testStore = store({ list });
    await expect(listDocumentLinkCandidates(
      createTestUserContext("user_1"),
      testStore.value,
    )).rejects.toBeInstanceOf(DocumentLinkCandidatesUnavailableError);
    expect(list).not.toHaveBeenCalled();
  });

  it("keeps link candidates owner scoped and purpose limited", async () => {
    const testStore = store();
    const result = await listDocumentLinkCandidates(
      createTestUserContext("user_8"),
      testStore.value,
      { runtimeEnabled: true },
    );
    expect(testStore.userIds).toEqual(["user_8"]);
    expect(result[0]).toMatchObject({
      targetType: "PROPERTY",
      targetEntityId: "property_1",
    });
    const candidates = await readFile(candidatesPath, "utf8");
    expect(candidates).not.toMatch(/description:\s*true|merchantName:\s*true|notes:\s*true|filename/);
  });

  it("offers metadata and links while file upload, OCR and extraction remain disabled", async () => {
    const [component, route, settings, service] = await Promise.all([
      readFile(componentPath, "utf8"),
      readFile(routePath, "utf8"),
      readFile(settingsPath, "utf8"),
      readFile(servicePath, "utf8"),
    ]);
    expect(settings).toContain("<DocumentMetadata");
    expect(component).toContain("Secure file upload unavailable");
    expect(component).toContain("Add document record");
    expect(component).toContain("file not uploaded");
    expect(component).toContain("OCR, AI extraction");
    expect(component).not.toMatch(/type="file"/);
    expect(route).toContain("getCurrentUserContext()");
    expect(route).not.toContain("prepareDocumentUpload");
    expect(service).toContain("DOCUMENT_METADATA_CREATED");
    expect(service).toContain("sizeBytes: 0");
  });

  it("exports metadata without storage internals and deletes owner records safely", async () => {
    const [accountExport, deletion] = await Promise.all([
      readFile(exportPath, "utf8"),
      readFile(deletionPath, "utf8"),
    ]);
    expect(accountExport).toContain("documents: ExportRecord[]");
    expect(accountExport).toContain("documentLinks: ExportRecord[]");
    const documentSelect = accountExport.match(/db\.document\.findMany\([\s\S]*?\n        \}\)/)?.[0] ?? "";
    expect(documentSelect).not.toMatch(/objectKey|storageProvider|checksumSha256/);
    expect(deletion).toContain("documentLink.deleteMany");
    expect(deletion).toContain("document.deleteMany");
  });

  it("uses the verified existing schema without adding file-byte or OCR fields", async () => {
    const schema = await readFile(schemaPath, "utf8");
    expect(schema).toContain("model Document");
    expect(schema).toContain("model DocumentLink");
    expect(schema).not.toMatch(/fileBytes|ocrText|extractedText|publicUrl/);
  });
});
