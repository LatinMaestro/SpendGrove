import { Prisma, type PrismaClient, type PropertyUsage } from "@prisma/client";
import { z } from "zod";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { OwnershipError, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

export const propertyTransactionLinkRequestSchema = z.object({
  propertyId: z.string().trim().min(1),
}).strict();

export class PropertyTransactionLinkConflictError extends Error {
  constructor(message = "That Property link changed. Refresh the transaction and try again.") {
    super(message);
    this.name = "PropertyTransactionLinkConflictError";
  }
}

export type SafePropertyLinkOption = {
  id: string;
  nickname: string;
  usage: PropertyUsage;
  isArchived: boolean;
};

export type SafePropertyTransactionLink = {
  id: string;
  property: SafePropertyLinkOption;
};

export type PropertyTransactionLinkSnapshot = {
  properties: SafePropertyLinkOption[];
  link: SafePropertyTransactionLink | null;
};

export type PropertyTransactionLinkStore = {
  snapshot(userId: string, transactionId: string): Promise<PropertyTransactionLinkSnapshot>;
  link(userId: string, transactionId: string, propertyId: string, now: Date): Promise<{ alreadyLinked: boolean; relinked: boolean }>;
  unlink(userId: string, transactionId: string, now: Date): Promise<{ alreadyUnlinked: boolean }>;
};

function safeProperty(record: {
  id: string;
  nickname: string;
  usage: PropertyUsage;
  isArchived: boolean;
}) {
  return {
    id: record.id,
    nickname: record.nickname,
    usage: record.usage,
    isArchived: record.isArchived,
  };
}

export function createPropertyLinkAuditEvent(
  userId: string,
  transactionId: string,
  state: "LINKED" | "UNLINKED" | "RELINKED",
) {
  const audit = {
    userId,
    entityType: "TRANSACTION" as const,
    entityId: transactionId,
    action: "UPDATED" as const,
    metadata: {
      propertyLinkState: state,
      reasonCode: "MANUAL_USER_ACTION",
    },
  };
  auditEventSchema.parse(audit);
  return audit;
}

export function createPrismaPropertyTransactionLinkStore(
  prisma: PrismaClient = getPrismaClient(),
): PropertyTransactionLinkStore {
  return {
    async snapshot(userId, transactionId) {
      const [transaction, properties, link] = await Promise.all([
        prisma.transaction.findFirst({
          where: {
            id: transactionId,
            userId,
            status: "ACTIVE",
            deletedAt: null,
            splitRole: { not: "PARENT" },
          },
          select: { id: true, userId: true },
        }),
        prisma.property.findMany({
          where: { userId, isArchived: false, deletedAt: null },
          select: { id: true, nickname: true, usage: true, isArchived: true },
          orderBy: { nickname: "asc" },
        }),
        prisma.propertyTransactionLink.findFirst({
          where: { transactionId, userId, unlinkedAt: null },
          select: {
            id: true,
            userId: true,
            property: {
              select: {
                id: true,
                userId: true,
                nickname: true,
                usage: true,
                isArchived: true,
                deletedAt: true,
              },
            },
          },
        }),
      ]);

      if (!transaction || transaction.userId !== userId) throw new OwnershipError("eligible everyday transaction");
      if (link && (link.userId !== userId || link.property.userId !== userId || link.property.deletedAt)) {
        throw new OwnershipError("Property link");
      }

      return {
        properties: properties.map(safeProperty),
        link: link ? { id: link.id, property: safeProperty(link.property) } : null,
      };
    },
    async link(userId, transactionId, propertyId, now) {
      try {
        return await prisma.$transaction(async (tx) => {
          const transaction = await tx.transaction.findFirst({
            where: {
              id: transactionId,
              userId,
              status: "ACTIVE",
              deletedAt: null,
              splitRole: { not: "PARENT" },
            },
            select: { id: true, userId: true },
          });
          if (!transaction || transaction.userId !== userId) throw new OwnershipError("eligible everyday transaction");

          const property = await tx.property.findFirst({
            where: { id: propertyId, userId, isArchived: false, deletedAt: null },
            select: { id: true, userId: true },
          });
          if (!property || property.userId !== userId) throw new OwnershipError("active Property");

          const existing = await tx.propertyTransactionLink.findUnique({
            where: { transactionId },
            select: { id: true, userId: true, propertyId: true, unlinkedAt: true },
          });
          if (existing && existing.userId !== userId) throw new OwnershipError("Property link");
          if (existing && existing.unlinkedAt === null) {
            if (existing.propertyId === property.id) return { alreadyLinked: true, relinked: false };
            throw new PropertyTransactionLinkConflictError("Unlink the current Property before choosing another one.");
          }

          const relinked = Boolean(existing);
          await tx.propertyTransactionLink.upsert({
            where: { transactionId },
            create: { userId, transactionId, propertyId: property.id, unlinkedAt: null },
            update: { propertyId: property.id, unlinkedAt: null, updatedAt: now },
          });
          await tx.auditEvent.create({
            data: createPropertyLinkAuditEvent(userId, transactionId, relinked ? "RELINKED" : "LINKED"),
          });
          return { alreadyLinked: false, relinked };
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 30_000,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034")) {
          throw new PropertyTransactionLinkConflictError();
        }
        throw error;
      }
    },
    async unlink(userId, transactionId, now) {
      try {
        return await prisma.$transaction(async (tx) => {
          const transaction = await tx.transaction.findFirst({
            where: { id: transactionId, userId },
            select: { id: true, userId: true },
          });
          if (!transaction || transaction.userId !== userId) throw new OwnershipError("everyday transaction");

          const link = await tx.propertyTransactionLink.findUnique({
            where: { transactionId },
            select: { id: true, userId: true, unlinkedAt: true },
          });
          if (!link || link.unlinkedAt) return { alreadyUnlinked: true };
          if (link.userId !== userId) throw new OwnershipError("Property link");

          await tx.propertyTransactionLink.update({
            where: { id: link.id },
            data: { unlinkedAt: now },
          });
          await tx.auditEvent.create({
            data: createPropertyLinkAuditEvent(userId, transactionId, "UNLINKED"),
          });
          return { alreadyUnlinked: false };
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 30_000,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
          throw new PropertyTransactionLinkConflictError();
        }
        throw error;
      }
    },
  };
}

export async function getPropertyTransactionLinkSnapshot(
  context: AuthenticatedUserContext | null | undefined,
  transactionId: string,
  store: PropertyTransactionLinkStore = createPrismaPropertyTransactionLinkStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  return store.snapshot(user.userId, transactionId);
}

export async function linkTransactionToProperty(
  context: AuthenticatedUserContext | null | undefined,
  transactionId: string,
  input: unknown,
  store: PropertyTransactionLinkStore = createPrismaPropertyTransactionLinkStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  const request = propertyTransactionLinkRequestSchema.parse(input);
  const result = await store.link(user.userId, transactionId, request.propertyId, now);
  return { result, snapshot: await store.snapshot(user.userId, transactionId) };
}

export async function unlinkTransactionFromProperty(
  context: AuthenticatedUserContext | null | undefined,
  transactionId: string,
  store: PropertyTransactionLinkStore = createPrismaPropertyTransactionLinkStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  return store.unlink(user.userId, transactionId, now);
}
