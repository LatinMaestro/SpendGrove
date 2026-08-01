import { randomBytes } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import { isVerifiedPreviewRuntime } from "@/src/server/preview-runtime";

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export type DocumentLinkTargetType =
  | "TRANSACTION" | "PROPERTY" | "LOAN_ACCOUNT" | "LOAN_REPAYMENT"
  | "IMPORT_BATCH" | "REPORT" | "FINANCIAL_YEAR";

export type DocumentRecord = {
  id: string;
  userId: string;
  displayName: string;
  category: "RECEIPT" | "INVOICE" | "LOAN_STATEMENT" | "PROPERTY_RECORD" | "REPORT_EVIDENCE" | "OTHER";
  status: "PENDING_UPLOAD" | "QUARANTINED" | "AVAILABLE" | "FAILED" | "DELETED";
  contentType: string;
  sizeBytes: number;
  checksumSha256: string | null;
  storageProvider: string | null;
  objectKey: string | null;
  documentDate: Date | null;
  financialYear: string | null;
  deletedAt: Date | null;
  links: Array<{
    id: string;
    targetType: DocumentLinkTargetType;
    targetKey: string;
    revokedAt: Date | null;
  }>;
};

export type DocumentStore = {
  list(userId: string): Promise<DocumentRecord[]>;
  createMetadata(
    userId: string,
    input: {
      displayName: string;
      category: DocumentRecord["category"];
      contentType: string;
      documentDate: Date | null;
      financialYear: string | null;
    },
    now: Date,
  ): Promise<DocumentRecord>;
  createPending(
    userId: string,
    input: {
      displayName: string;
      category: DocumentRecord["category"];
      contentType: string;
      sizeBytes: number;
      storageProvider: string;
      objectKey: string;
      documentDate: Date | null;
      financialYear: string | null;
    },
    now: Date,
  ): Promise<DocumentRecord>;
  addLink(
    userId: string,
    documentId: string,
    targetType: DocumentLinkTargetType,
    targetKey: string,
    targetEntityId: string | null,
    now: Date,
  ): Promise<DocumentRecord | null>;
  revokeLink(
    userId: string,
    documentId: string,
    linkId: string,
    now: Date,
  ): Promise<DocumentRecord | null>;
  softDelete(
    userId: string,
    documentId: string,
    now: Date,
  ): Promise<"METADATA_ONLY" | "PROVIDER_CLEANUP" | null>;
};

export type DocumentStorageAdapter = {
  code: string;
  prepareUpload(input: {
    objectKey: string;
    contentType: string;
    sizeBytes: number;
  }): Promise<{ uploadAuthorization: string }>;
};

export class DocumentsUnavailableError extends Error {
  constructor() {
    super("Documents are not available until storage and Preview migration gates are verified.");
    this.name = "DocumentsUnavailableError";
  }
}

export class DocumentProviderUnavailableError extends Error {
  constructor() {
    super("Document upload is not available until private storage is configured.");
    this.name = "DocumentProviderUnavailableError";
  }
}

export class DocumentConflictError extends Error {
  constructor(message = "That document action is no longer available.") {
    super(message);
    this.name = "DocumentConflictError";
  }
}

const idSchema = z.string().trim().min(1).max(128);
const financialYearSchema = z.string().regex(/^\d{4}-\d{2}$/).nullable();
const displayNameSchema = z.string().trim().min(1).max(120)
  .refine((value) => !/[\\/\u0000-\u001f\u007f]/.test(value), "Use a plain document label.")
  .transform((value) => value.replace(/\s+/g, " "));
const contentTypeSchema = z.enum(ALLOWED_CONTENT_TYPES);
const sizeSchema = z.number().int().positive().max(MAX_DOCUMENT_SIZE_BYTES);

export const documentMetadataSchema = z.object({
  action: z.literal("CREATE_METADATA"),
  displayName: displayNameSchema,
  category: z.enum([
    "RECEIPT", "INVOICE", "LOAN_STATEMENT", "PROPERTY_RECORD",
    "REPORT_EVIDENCE", "OTHER",
  ]),
  contentType: contentTypeSchema,
  documentDate: z.string().date().nullable().default(null),
  financialYear: financialYearSchema.default(null),
}).strict();

export const documentPreparationSchema = z.object({
  displayName: displayNameSchema,
  category: z.enum([
    "RECEIPT", "INVOICE", "LOAN_STATEMENT", "PROPERTY_RECORD",
    "REPORT_EVIDENCE", "OTHER",
  ]),
  contentType: contentTypeSchema,
  sizeBytes: sizeSchema,
  documentDate: z.string().date().nullable().default(null),
  financialYear: financialYearSchema.default(null),
}).strict();

const recordLinkSchema = z.object({
  action: z.literal("LINK"),
  documentId: idSchema,
  targetType: z.enum([
    "TRANSACTION", "PROPERTY", "LOAN_ACCOUNT", "LOAN_REPAYMENT", "IMPORT_BATCH",
  ]),
  targetEntityId: idSchema,
}).strict();

const keyedLinkSchema = z.object({
  action: z.literal("LINK"),
  documentId: idSchema,
  targetType: z.enum(["REPORT", "FINANCIAL_YEAR"]),
  targetKey: idSchema,
}).strict();

export const documentMutationSchema = z.union([
  documentMetadataSchema,
  recordLinkSchema,
  keyedLinkSchema,
  z.object({
    action: z.literal("UNLINK"),
    documentId: idSchema,
    linkId: idSchema,
  }).strict(),
  z.object({
    action: z.literal("DELETE"),
    documentId: idSchema,
  }).strict(),
]);

function safeAudit(
  userId: string,
  entityType: "DOCUMENT" | "DOCUMENT_LINK",
  entityId: string,
  action: "CREATED" | "DELETED",
  reasonCode: string,
): Prisma.AuditEventUncheckedCreateInput {
  return auditEventSchema.parse({
    userId,
    entityType,
    entityId,
    action,
    metadata: { reasonCode },
  }) as Prisma.AuditEventUncheckedCreateInput;
}

const documentInclude = {
  links: {
    where: { revokedAt: null },
    select: { id: true, targetType: true, targetKey: true, revokedAt: true },
    orderBy: { linkedAt: "desc" },
  },
} satisfies Prisma.DocumentInclude;

async function validateOwnedTarget(
  tx: Prisma.TransactionClient,
  userId: string,
  targetType: DocumentLinkTargetType,
  targetEntityId: string,
) {
  if (targetType === "TRANSACTION") {
    return Boolean(await tx.transaction.findFirst({
      where: { id: targetEntityId, userId, deletedAt: null },
      select: { id: true },
    }));
  }
  if (targetType === "PROPERTY") {
    return Boolean(await tx.property.findFirst({
      where: { id: targetEntityId, userId, deletedAt: null },
      select: { id: true },
    }));
  }
  if (targetType === "LOAN_ACCOUNT") {
    return Boolean(await tx.loanAccount.findFirst({
      where: { id: targetEntityId, userId, deletedAt: null },
      select: { id: true },
    }));
  }
  if (targetType === "LOAN_REPAYMENT") {
    return Boolean(await tx.loanRepayment.findFirst({
      where: { id: targetEntityId, userId, deletedAt: null },
      select: { id: true },
    }));
  }
  return Boolean(await tx.importBatch.findFirst({
    where: { id: targetEntityId, userId, deletedAt: null },
    select: { id: true },
  }));
}

function validKeyedTarget(targetType: "REPORT" | "FINANCIAL_YEAR", targetKey: string) {
  if (targetType === "FINANCIAL_YEAR") return /^\d{4}-\d{2}$/.test(targetKey);
  return ["monthly", "loan", "property", "accountant-pack"].includes(targetKey);
}

export function createPrismaDocumentStore(
  prisma: PrismaClient = getPrismaClient(),
): DocumentStore {
  return {
    async list(userId) {
      return (await prisma.document.findMany({
        where: { userId, deletedAt: null },
        include: documentInclude,
        orderBy: { createdAt: "desc" },
      })) as unknown as DocumentRecord[];
    },

    async createMetadata(userId, input, now) {
      return prisma.$transaction(async (tx) => {
        const document = await tx.document.create({
          data: {
            userId,
            ...input,
            sizeBytes: 0,
            storageProvider: null,
            objectKey: null,
            status: "PENDING_UPLOAD",
            createdAt: now,
          },
          include: documentInclude,
        });
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "DOCUMENT",
            document.id,
            "CREATED",
            "DOCUMENT_METADATA_CREATED",
          ),
        });
        return document as unknown as DocumentRecord;
      });
    },

    async createPending(userId, input, now) {
      return prisma.$transaction(async (tx) => {
        const document = await tx.document.create({
          data: {
            userId,
            ...input,
            status: "PENDING_UPLOAD",
            createdAt: now,
          },
          include: documentInclude,
        });
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "DOCUMENT",
            document.id,
            "CREATED",
            "DOCUMENT_UPLOAD_PREPARED",
          ),
        });
        return document as unknown as DocumentRecord;
      });
    },

    async addLink(userId, documentId, targetType, targetKey, targetEntityId, now) {
      return prisma.$transaction(async (tx) => {
        const document = await tx.document.findFirst({
          where: { id: documentId, userId, deletedAt: null },
          select: { id: true },
        });
        if (!document) return null;
        if (
          targetEntityId
          && !await validateOwnedTarget(tx, userId, targetType, targetEntityId)
        ) return null;
        if (
          !targetEntityId
          && (
            (targetType !== "REPORT" && targetType !== "FINANCIAL_YEAR")
            || !validKeyedTarget(targetType, targetKey)
          )
        ) return null;
        const link = await tx.documentLink.upsert({
          where: { documentId_targetType_targetKey: { documentId, targetType, targetKey } },
          create: {
            userId,
            documentId,
            targetType,
            targetKey,
            targetEntityId,
            linkedAt: now,
          },
          update: { targetEntityId, revokedAt: null, linkedAt: now },
        });
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "DOCUMENT_LINK",
            link.id,
            "CREATED",
            "DOCUMENT_LINK_CREATED",
          ),
        });
        return (await tx.document.findFirst({
          where: { id: documentId, userId, deletedAt: null },
          include: documentInclude,
        })) as unknown as DocumentRecord | null;
      });
    },

    async revokeLink(userId, documentId, linkId, now) {
      return prisma.$transaction(async (tx) => {
        const changed = await tx.documentLink.updateMany({
          where: { id: linkId, documentId, userId, revokedAt: null },
          data: { revokedAt: now },
        });
        if (changed.count !== 1) return null;
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "DOCUMENT_LINK",
            linkId,
            "DELETED",
            "DOCUMENT_LINK_REVOKED",
          ),
        });
        return (await tx.document.findFirst({
          where: { id: documentId, userId, deletedAt: null },
          include: documentInclude,
        })) as unknown as DocumentRecord | null;
      });
    },

    async softDelete(userId, documentId, now) {
      return prisma.$transaction(async (tx) => {
        const existing = await tx.document.findFirst({
          where: { id: documentId, userId, deletedAt: null },
          select: { storageProvider: true, objectKey: true },
        });
        if (!existing) return null;
        const changed = await tx.document.updateMany({
          where: { id: documentId, userId, deletedAt: null },
          data: { status: "DELETED", deletedAt: now },
        });
        if (changed.count !== 1) return null;
        await tx.documentLink.updateMany({
          where: { documentId, userId, revokedAt: null },
          data: { revokedAt: now },
        });
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "DOCUMENT",
            documentId,
            "DELETED",
            "DOCUMENT_ACCESS_REVOKED",
          ),
        });
        return existing.storageProvider && existing.objectKey
          ? "PROVIDER_CLEANUP" as const
          : "METADATA_ONLY" as const;
      });
    },
  };
}

type RuntimeOptions = {
  runtimeEnabled?: boolean;
  providerEnabled?: boolean;
};

function requireRuntime(options: RuntimeOptions) {
  if (!(options.runtimeEnabled ?? isVerifiedPreviewRuntime())) {
    throw new DocumentsUnavailableError();
  }
}

function toView(record: DocumentRecord) {
  return {
    id: record.id,
    displayName: record.displayName,
    category: record.category,
    status: record.status,
    contentType: record.contentType,
    sizeBytes: record.sizeBytes,
    documentDate: record.documentDate,
    financialYear: record.financialYear,
    links: record.links.map(({ id, targetType, targetKey }) => ({
      id,
      targetType,
      targetKey,
    })),
  };
}

export async function listDocuments(
  context: AuthenticatedUserContext | null | undefined,
  store?: DocumentStore,
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  return (await (store ?? createPrismaDocumentStore()).list(user.userId)).map(toView);
}

export async function prepareDocumentUpload(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  adapter: DocumentStorageAdapter | null,
  store?: DocumentStore,
  now = new Date(),
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  if (!options.providerEnabled || !adapter) throw new DocumentProviderUnavailableError();
  const user = requireAuthenticatedUserContext(context);
  const request = documentPreparationSchema.parse(input);
  if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(adapter.code)) {
    throw new DocumentProviderUnavailableError();
  }
  const objectKey = `documents/${randomBytes(24).toString("hex")}`;
  const prepared = await adapter.prepareUpload({
    objectKey,
    contentType: request.contentType,
    sizeBytes: request.sizeBytes,
  });
  const document = await (store ?? createPrismaDocumentStore()).createPending(
    user.userId,
    {
      displayName: request.displayName,
      category: request.category,
      contentType: request.contentType,
      sizeBytes: request.sizeBytes,
      storageProvider: adapter.code,
      objectKey,
      documentDate: request.documentDate
        ? new Date(`${request.documentDate}T00:00:00.000Z`)
        : null,
      financialYear: request.financialYear,
    },
    now,
  );
  return {
    document: toView(document),
    uploadAuthorization: prepared.uploadAuthorization,
  };
}

export async function mutateDocumentMetadata(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  store?: DocumentStore,
  now = new Date(),
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const request = documentMutationSchema.parse(input);
  const resolvedStore = store ?? createPrismaDocumentStore();

  if (request.action === "CREATE_METADATA") {
    const document = await resolvedStore.createMetadata(
      user.userId,
      {
        displayName: request.displayName,
        category: request.category,
        contentType: request.contentType,
        documentDate: request.documentDate
          ? new Date(`${request.documentDate}T00:00:00.000Z`)
          : null,
        financialYear: request.financialYear,
      },
      now,
    );
    return { type: "DOCUMENT" as const, document: toView(document) };
  }

  if (request.action === "LINK") {
    let targetEntityId: string | null;
    let targetKey: string;
    if ("targetEntityId" in request) {
      targetEntityId = request.targetEntityId;
      targetKey = `${request.targetType}:${request.targetEntityId}`;
    } else {
      targetEntityId = null;
      targetKey = request.targetKey;
    }
    const document = await resolvedStore.addLink(
      user.userId,
      request.documentId,
      request.targetType,
      targetKey,
      targetEntityId,
      now,
    );
    if (!document) throw new DocumentConflictError();
    return { type: "DOCUMENT" as const, document: toView(document) };
  }

  if (request.action === "UNLINK") {
    const document = await resolvedStore.revokeLink(
      user.userId,
      request.documentId,
      request.linkId,
      now,
    );
    if (!document) throw new DocumentConflictError();
    return { type: "DOCUMENT" as const, document: toView(document) };
  }

  const deleted = await resolvedStore.softDelete(user.userId, request.documentId, now);
  if (!deleted) throw new DocumentConflictError();
  return {
    type: "DELETED" as const,
    providerCleanupRequired: deleted === "PROVIDER_CLEANUP",
  };
}
