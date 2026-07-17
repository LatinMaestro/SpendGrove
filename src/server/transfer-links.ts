import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

export const TRANSFER_LINK_RUNTIME_ENABLED = false;
export const TRANSFER_LINK_MAX_CALENDAR_DAY_DIFFERENCE = 2;

export const confirmTransferLinkSchema = z.object({
  outgoingTransactionId: z.string().trim().min(1),
  incomingTransactionId: z.string().trim().min(1),
}).strict().superRefine((input, context) => {
  if (input.outgoingTransactionId === input.incomingTransactionId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Choose two different transfer transactions.",
      path: ["incomingTransactionId"],
    });
  }
});

export type ConfirmTransferLinkInput = z.infer<typeof confirmTransferLinkSchema>;

type StoredTransferLink = {
  id: string;
  userId: string;
  outgoingTransactionId: string;
  incomingTransactionId: string;
  confirmedAt: Date;
  unlinkedAt: Date | null;
};

export type SafeTransferLink = {
  id: string;
  outgoingTransactionId: string;
  incomingTransactionId: string;
  confirmedAt: string;
  unlinkedAt: string | null;
};

export type TransferLinkStore = {
  confirm(
    userId: string,
    input: ConfirmTransferLinkInput,
    now: Date,
  ): Promise<StoredTransferLink>;
  unlink(userId: string, linkId: string, now: Date): Promise<StoredTransferLink | null>;
};

export class TransferLinksUnavailableError extends Error {
  constructor() {
    super("Transfer linking is not available until the Preview migration is verified.");
    this.name = "TransferLinksUnavailableError";
  }
}

export class TransferLinkEligibilityError extends Error {
  constructor(message = "These transactions are not a clear transfer match.") {
    super(message);
    this.name = "TransferLinkEligibilityError";
  }
}

export class TransferLinkConflictError extends Error {
  constructor() {
    super("One of these transactions was linked elsewhere. Review the transfers and try again.");
    this.name = "TransferLinkConflictError";
  }
}

export class TransferLinkNotFoundError extends Error {
  constructor() {
    super("That transfer link could not be found for your account.");
    this.name = "TransferLinkNotFoundError";
  }
}

type TransferRecord = {
  id: string;
  amountCents: number;
  date: Date;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  status: "ACTIVE" | "NEEDS_REVIEW" | "DELETED";
  splitRole: "NONE" | "PARENT" | "CHILD";
  deletedAt: Date | null;
  outgoingTransferLinks: Array<{ id: string }>;
  incomingTransferLinks: Array<{ id: string }>;
};

function australianCalendarDayNumber(value: Date) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function isUnlinkedTransfer(record: TransferRecord) {
  return record.type === "TRANSFER"
    && record.status === "ACTIVE"
    && record.deletedAt === null
    && record.splitRole === "NONE"
    && record.outgoingTransferLinks.length === 0
    && record.incomingTransferLinks.length === 0;
}

function safeAuditData(
  userId: string,
  linkId: string,
  reasonCode: "USER_CONFIRMED" | "USER_UNLINKED",
): Prisma.AuditEventUncheckedCreateInput {
  const audit = {
    userId,
    entityType: "TRANSFER_LINK" as const,
    entityId: linkId,
    action: "UPDATED" as const,
    metadata: { reasonCode } satisfies Prisma.InputJsonObject,
  };
  auditEventSchema.parse(audit);
  return audit;
}

function serialize(link: StoredTransferLink): SafeTransferLink {
  return {
    id: link.id,
    outgoingTransactionId: link.outgoingTransactionId,
    incomingTransactionId: link.incomingTransactionId,
    confirmedAt: link.confirmedAt.toISOString(),
    unlinkedAt: link.unlinkedAt?.toISOString() ?? null,
  };
}

const activeTransferLinkSelection = {
  outgoingTransferLinks: {
    where: { unlinkedAt: null },
    select: { id: true },
  },
  incomingTransferLinks: {
    where: { unlinkedAt: null },
    select: { id: true },
  },
} satisfies Prisma.TransactionInclude;

export function createPrismaTransferLinkStore(
  prisma: PrismaClient = getPrismaClient(),
): TransferLinkStore {
  return {
    async confirm(userId, input, now) {
      try {
        return await prisma.$transaction(async (tx) => {
          const [outgoing, requestedIncoming] = await Promise.all([
            tx.transaction.findFirst({
              where: { id: input.outgoingTransactionId, userId },
              include: activeTransferLinkSelection,
            }),
            tx.transaction.findFirst({
              where: { id: input.incomingTransactionId, userId },
              include: activeTransferLinkSelection,
            }),
          ]);
          if (!outgoing || !requestedIncoming) throw new TransferLinkEligibilityError();
          if (
            !isUnlinkedTransfer(outgoing as TransferRecord)
            || !isUnlinkedTransfer(requestedIncoming as TransferRecord)
            || outgoing.amountCents >= 0
            || requestedIncoming.amountCents <= 0
            || outgoing.amountCents !== -requestedIncoming.amountCents
          ) {
            throw new TransferLinkEligibilityError();
          }

          const dayDifference = Math.abs(
            australianCalendarDayNumber(outgoing.date)
            - australianCalendarDayNumber(requestedIncoming.date),
          );
          if (dayDifference > TRANSFER_LINK_MAX_CALENDAR_DAY_DIFFERENCE) {
            throw new TransferLinkEligibilityError();
          }

          const broadStart = new Date(outgoing.date.getTime() - 3 * 86_400_000);
          const broadEnd = new Date(outgoing.date.getTime() + 3 * 86_400_000);
          const candidates = await tx.transaction.findMany({
            where: {
              userId,
              id: { not: outgoing.id },
              type: "TRANSFER",
              status: "ACTIVE",
              deletedAt: null,
              splitRole: "NONE",
              amountCents: -outgoing.amountCents,
              date: { gte: broadStart, lte: broadEnd },
              outgoingTransferLinks: { none: { unlinkedAt: null } },
              incomingTransferLinks: { none: { unlinkedAt: null } },
            },
            select: { id: true, date: true },
            take: 3,
          });
          const exactCandidates = candidates.filter((candidate) => Math.abs(
            australianCalendarDayNumber(outgoing.date)
            - australianCalendarDayNumber(candidate.date),
          ) <= TRANSFER_LINK_MAX_CALENDAR_DAY_DIFFERENCE);
          if (
            exactCandidates.length !== 1
            || exactCandidates[0]?.id !== requestedIncoming.id
          ) {
            throw new TransferLinkEligibilityError(
              exactCandidates.length > 1
                ? "More than one possible transfer match was found. Leave these transfers unlinked."
                : "No clear transfer match was found.",
            );
          }

          const created = await tx.transferLink.create({
            data: {
              userId,
              outgoingTransactionId: outgoing.id,
              incomingTransactionId: requestedIncoming.id,
              confirmedAt: now,
              unlinkedAt: null,
            },
          });
          await tx.auditEvent.create({
            data: safeAuditData(userId, created.id, "USER_CONFIRMED"),
          });
          return created as StoredTransferLink;
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 30_000,
        });
      } catch (error) {
        if (error instanceof TransferLinkEligibilityError) throw error;
        if (
          error instanceof Prisma.PrismaClientKnownRequestError
          && (error.code === "P2002" || error.code === "P2034")
        ) {
          throw new TransferLinkConflictError();
        }
        throw error;
      }
    },

    async unlink(userId, linkId, now) {
      return prisma.$transaction(async (tx) => {
        const link = await tx.transferLink.findFirst({
          where: { id: linkId, userId, unlinkedAt: null },
        });
        if (!link) return null;
        const updated = await tx.transferLink.updateMany({
          where: { id: link.id, userId, unlinkedAt: null },
          data: { unlinkedAt: now },
        });
        if (updated.count !== 1) throw new TransferLinkConflictError();
        await tx.auditEvent.create({
          data: safeAuditData(userId, link.id, "USER_UNLINKED"),
        });
        return {
          ...link,
          unlinkedAt: now,
        } as StoredTransferLink;
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 30_000,
      });
    },
  };
}

type TransferLinkRuntimeOptions = { runtimeEnabled?: boolean };

function runtimeEnabled(options: TransferLinkRuntimeOptions) {
  return options.runtimeEnabled ?? TRANSFER_LINK_RUNTIME_ENABLED;
}

export async function confirmTransferLink(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  store: TransferLinkStore = createPrismaTransferLinkStore(),
  now = new Date(),
  options: TransferLinkRuntimeOptions = {},
) {
  if (!runtimeEnabled(options)) throw new TransferLinksUnavailableError();
  const user = requireAuthenticatedUserContext(context);
  const validated = confirmTransferLinkSchema.parse(input);
  return serialize(await store.confirm(user.userId, validated, now));
}

export async function unlinkTransferLink(
  context: AuthenticatedUserContext | null | undefined,
  linkId: string,
  store: TransferLinkStore = createPrismaTransferLinkStore(),
  now = new Date(),
  options: TransferLinkRuntimeOptions = {},
) {
  if (!runtimeEnabled(options)) throw new TransferLinksUnavailableError();
  const user = requireAuthenticatedUserContext(context);
  const link = await store.unlink(user.userId, z.string().trim().min(1).parse(linkId), now);
  if (!link) throw new TransferLinkNotFoundError();
  return serialize(link);
}
