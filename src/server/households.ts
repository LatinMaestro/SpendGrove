import { createHash, randomBytes } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import { PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED } from "@/src/server/phase-9-runtime";
import { PHASE_10_COLLABORATION_RUNTIME_ENABLED } from "@/src/server/phase-10-runtime";

export type HouseholdRoleCode = "ADMIN" | "MEMBER";
export type HouseholdShareType =
  | "TRANSACTION" | "PROPERTY" | "LOAN_ACCOUNT" | "CATEGORY_BUDGET"
  | "RECURRING_ITEM" | "SAVINGS_GOAL" | "NET_WORTH_SNAPSHOT" | "REPORT";

type HouseholdViewRecord = {
  id: string;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  memberships: Array<{
    id: string;
    userId: string;
    role: HouseholdRoleCode;
    status: "ACTIVE" | "LEFT" | "REMOVED";
  }>;
  shares: Array<{
    id: string;
    ownerUserId: string;
    entityType: HouseholdShareType;
    entityId: string;
    revokedAt: Date | null;
  }>;
};

export type HouseholdStore = {
  listForMember(userId: string): Promise<HouseholdViewRecord[]>;
  create(userId: string, name: string, now: Date): Promise<HouseholdViewRecord>;
  createInvitation(
    userId: string,
    householdId: string,
    role: HouseholdRoleCode,
    tokenHash: string,
    intendedIdentityHash: string | null,
    expiresAt: Date,
    now: Date,
  ): Promise<{ id: string } | null>;
  acceptInvitation(
    userId: string,
    tokenHash: string,
    identityHash: string | null,
    now: Date,
  ): Promise<HouseholdViewRecord | null>;
  setRole(
    userId: string,
    householdId: string,
    membershipId: string,
    role: HouseholdRoleCode,
  ): Promise<HouseholdViewRecord | null>;
  endMembership(
    userId: string,
    householdId: string,
    membershipId: string,
    status: "LEFT" | "REMOVED",
    now: Date,
  ): Promise<{ ended: boolean; household: HouseholdViewRecord | null }>;
  shareRecord(
    userId: string,
    householdId: string,
    entityType: HouseholdShareType,
    entityId: string,
    now: Date,
  ): Promise<HouseholdViewRecord | null>;
  revokeShare(
    userId: string,
    householdId: string,
    shareId: string,
    now: Date,
  ): Promise<HouseholdViewRecord | null>;
};

export class HouseholdUnavailableError extends Error {
  constructor() {
    super("Household sharing is not available until the Preview migration is verified.");
    this.name = "HouseholdUnavailableError";
  }
}

export class HouseholdConflictError extends Error {
  constructor(message = "That household action is no longer available.") {
    super(message);
    this.name = "HouseholdConflictError";
  }
}

const idSchema = z.string().trim().min(1).max(128);
const nameSchema = z.string().trim().min(1).max(80)
  .transform((value) => value.replace(/\s+/g, " "));
const identityHashSchema = z.string().regex(/^[a-f0-9]{64}$/).nullable();

export const householdMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("CREATE"), name: nameSchema }).strict(),
  z.object({
    action: z.literal("INVITE"),
    householdId: idSchema,
    role: z.enum(["ADMIN", "MEMBER"]),
    intendedIdentityHash: identityHashSchema.default(null),
    expiresAt: z.string().datetime(),
  }).strict(),
  z.object({
    action: z.literal("ACCEPT_INVITATION"),
    token: z.string().min(32).max(256),
    identityHash: identityHashSchema.default(null),
  }).strict(),
  z.object({
    action: z.literal("SET_ROLE"),
    householdId: idSchema,
    membershipId: idSchema,
    role: z.enum(["ADMIN", "MEMBER"]),
  }).strict(),
  z.object({
    action: z.literal("END_MEMBERSHIP"),
    householdId: idSchema,
    membershipId: idSchema,
    status: z.enum(["LEFT", "REMOVED"]),
  }).strict(),
  z.object({
    action: z.literal("SHARE"),
    householdId: idSchema,
    entityType: z.enum([
      "TRANSACTION", "PROPERTY", "LOAN_ACCOUNT", "CATEGORY_BUDGET",
      "RECURRING_ITEM", "SAVINGS_GOAL", "NET_WORTH_SNAPSHOT", "REPORT",
    ]),
    entityId: idSchema,
  }).strict(),
  z.object({
    action: z.literal("REVOKE_SHARE"),
    householdId: idSchema,
    shareId: idSchema,
  }).strict(),
]);

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeAudit(
  userId: string,
  entityType: "HOUSEHOLD" | "HOUSEHOLD_MEMBERSHIP" | "HOUSEHOLD_INVITATION" | "HOUSEHOLD_RECORD_SHARE",
  entityId: string,
  action: "CREATED" | "UPDATED" | "DELETED" | "ARCHIVED",
  reasonCode: string,
): Prisma.AuditEventUncheckedCreateInput {
  return auditEventSchema.parse({
    userId, entityType, entityId, action, metadata: { reasonCode },
  }) as Prisma.AuditEventUncheckedCreateInput;
}

const householdInclude = {
  memberships: {
    where: { status: "ACTIVE" },
    select: { id: true, userId: true, role: true, status: true },
    orderBy: { joinedAt: "asc" },
  },
  shares: {
    where: { revokedAt: null },
    select: {
      id: true, ownerUserId: true, entityType: true, entityId: true, revokedAt: true,
    },
    orderBy: { sharedAt: "desc" },
  },
} satisfies Prisma.HouseholdInclude;

async function householdForMember(
  tx: Prisma.TransactionClient,
  userId: string,
  householdId: string,
) {
  return tx.household.findFirst({
    where: {
      id: householdId,
      memberships: { some: { userId, status: "ACTIVE" } },
    },
    include: householdInclude,
  });
}

async function activeMembership(
  tx: Prisma.TransactionClient,
  userId: string,
  householdId: string,
) {
  return tx.householdMembership.findFirst({
    where: { householdId, userId, status: "ACTIVE" },
  });
}

async function requireAdmin(
  tx: Prisma.TransactionClient,
  userId: string,
  householdId: string,
) {
  return tx.householdMembership.findFirst({
    where: { householdId, userId, status: "ACTIVE", role: "ADMIN" },
  });
}

async function validateOwnedSource(
  tx: Prisma.TransactionClient,
  userId: string,
  entityType: HouseholdShareType,
  entityId: string,
) {
  if (entityType === "REPORT") {
    return ["monthly", "loan", "property", "accountant-pack"].includes(entityId);
  }
  if (entityType === "TRANSACTION") {
    return Boolean(await tx.transaction.findFirst({
      where: { id: entityId, userId, deletedAt: null }, select: { id: true },
    }));
  }
  if (entityType === "PROPERTY") {
    return Boolean(await tx.property.findFirst({
      where: { id: entityId, userId, deletedAt: null }, select: { id: true },
    }));
  }
  if (entityType === "LOAN_ACCOUNT") {
    return Boolean(await tx.loanAccount.findFirst({
      where: { id: entityId, userId, deletedAt: null }, select: { id: true },
    }));
  }
  if (entityType === "CATEGORY_BUDGET") {
    return Boolean(await tx.categoryBudget.findFirst({
      where: { id: entityId, userId }, select: { id: true },
    }));
  }
  if (entityType === "RECURRING_ITEM") {
    return Boolean(await tx.recurringItem.findFirst({
      where: { id: entityId, userId }, select: { id: true },
    }));
  }
  if (!PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED) return false;
  if (entityType === "SAVINGS_GOAL") {
    return Boolean(await tx.savingsGoal.findFirst({
      where: { id: entityId, userId }, select: { id: true },
    }));
  }
  return Boolean(await tx.netWorthSnapshot.findFirst({
    where: { id: entityId, userId, archivedAt: null }, select: { id: true },
  }));
}

export function createPrismaHouseholdStore(
  prisma: PrismaClient = getPrismaClient(),
): HouseholdStore {
  return {
    async listForMember(userId) {
      return prisma.household.findMany({
        where: { memberships: { some: { userId, status: "ACTIVE" } } },
        include: householdInclude,
        orderBy: { name: "asc" },
      }) as unknown as Promise<HouseholdViewRecord[]>;
    },

    async create(userId, name, now) {
      return prisma.$transaction(async (tx) => {
        const household = await tx.household.create({
          data: {
            creatorUserId: userId,
            name,
            memberships: {
              create: { userId, role: "ADMIN", status: "ACTIVE", joinedAt: now },
            },
          },
          include: householdInclude,
        });
        await tx.auditEvent.create({
          data: safeAudit(userId, "HOUSEHOLD", household.id, "CREATED", "HOUSEHOLD_CREATED"),
        });
        return household as unknown as HouseholdViewRecord;
      });
    },

    async createInvitation(userId, householdId, role, tokenHash, intendedIdentityHash, expiresAt, now) {
      return prisma.$transaction(async (tx) => {
        if (!await requireAdmin(tx, userId, householdId)) return null;
        const invitation = await tx.householdInvitation.create({
          data: {
            householdId, inviterUserId: userId, role, tokenHash,
            intendedIdentityHash, status: "PENDING", expiresAt, createdAt: now,
          },
        });
        await tx.auditEvent.create({
          data: safeAudit(
            userId, "HOUSEHOLD_INVITATION", invitation.id, "CREATED",
            "HOUSEHOLD_INVITATION_CREATED",
          ),
        });
        return { id: invitation.id };
      });
    },

    async acceptInvitation(userId, tokenHash, identityHash, now) {
      return prisma.$transaction(async (tx) => {
        const invitation = await tx.householdInvitation.findUnique({
          where: { tokenHash },
        });
        if (
          !invitation
          || invitation.status !== "PENDING"
          || invitation.expiresAt <= now
          || (invitation.intendedIdentityHash && invitation.intendedIdentityHash !== identityHash)
        ) return null;
        const existing = await tx.householdMembership.findUnique({
          where: {
            householdId_userId: { householdId: invitation.householdId, userId },
          },
        });
        if (existing?.status === "ACTIVE") return null;
        if (existing) {
          await tx.householdMembership.update({
            where: { id: existing.id },
            data: { role: invitation.role, status: "ACTIVE", joinedAt: now, endedAt: null },
          });
        } else {
          await tx.householdMembership.create({
            data: {
              householdId: invitation.householdId,
              userId,
              role: invitation.role,
              status: "ACTIVE",
              joinedAt: now,
            },
          });
        }
        const changed = await tx.householdInvitation.updateMany({
          where: { id: invitation.id, status: "PENDING" },
          data: { status: "ACCEPTED", acceptedUserId: userId, acceptedAt: now },
        });
        if (changed.count !== 1) throw new HouseholdConflictError();
        await tx.auditEvent.create({
          data: safeAudit(
            userId, "HOUSEHOLD_MEMBERSHIP", invitation.householdId, "CREATED",
            "HOUSEHOLD_INVITATION_ACCEPTED",
          ),
        });
        return householdForMember(tx, userId, invitation.householdId)
          as unknown as Promise<HouseholdViewRecord | null>;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },

    async setRole(userId, householdId, membershipId, role) {
      return prisma.$transaction(async (tx) => {
        if (!await requireAdmin(tx, userId, householdId)) return null;
        const target = await tx.householdMembership.findFirst({
          where: { id: membershipId, householdId, status: "ACTIVE" },
        });
        if (!target) return null;
        if (target.role === "ADMIN" && role !== "ADMIN") {
          const admins = await tx.householdMembership.count({
            where: { householdId, status: "ACTIVE", role: "ADMIN" },
          });
          if (admins <= 1) return null;
        }
        await tx.householdMembership.update({
          where: { id: membershipId },
          data: { role },
        });
        await tx.auditEvent.create({
          data: safeAudit(
            userId, "HOUSEHOLD_MEMBERSHIP", membershipId, "UPDATED",
            `HOUSEHOLD_ROLE_${role}`,
          ),
        });
        return householdForMember(tx, userId, householdId)
          as unknown as Promise<HouseholdViewRecord | null>;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },

    async endMembership(userId, householdId, membershipId, status, now) {
      return prisma.$transaction(async (tx) => {
        const actor = await activeMembership(tx, userId, householdId);
        const target = await tx.householdMembership.findFirst({
          where: { id: membershipId, householdId, status: "ACTIVE" },
        });
        if (!actor || !target) return { ended: false, household: null };
        const isSelf = actor.id === target.id;
        if ((!isSelf && actor.role !== "ADMIN") || (isSelf && status !== "LEFT")) {
          return { ended: false, household: null };
        }
        if (target.role === "ADMIN") {
          const admins = await tx.householdMembership.count({
            where: { householdId, status: "ACTIVE", role: "ADMIN" },
          });
          if (admins <= 1) return { ended: false, household: null };
        }
        await tx.householdMembership.update({
          where: { id: target.id },
          data: { status, endedAt: now },
        });
        await tx.auditEvent.create({
          data: safeAudit(
            userId, "HOUSEHOLD_MEMBERSHIP", target.id, "DELETED",
            status === "LEFT" ? "HOUSEHOLD_MEMBER_LEFT" : "HOUSEHOLD_MEMBER_REMOVED",
          ),
        });
        const household = isSelf
          ? null
          : await householdForMember(tx, userId, householdId)
            as unknown as HouseholdViewRecord | null;
        return { ended: true, household };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },

    async shareRecord(userId, householdId, entityType, entityId, now) {
      return prisma.$transaction(async (tx) => {
        if (!await activeMembership(tx, userId, householdId)) return null;
        if (!await validateOwnedSource(tx, userId, entityType, entityId)) return null;
        const share = await tx.householdRecordShare.upsert({
          where: {
            householdId_ownerUserId_entityType_entityId: {
              householdId, ownerUserId: userId, entityType, entityId,
            },
          },
          create: { householdId, ownerUserId: userId, entityType, entityId, sharedAt: now },
          update: { revokedAt: null, sharedAt: now },
        });
        await tx.auditEvent.create({
          data: safeAudit(
            userId, "HOUSEHOLD_RECORD_SHARE", share.id, "CREATED",
            "HOUSEHOLD_RECORD_SHARED",
          ),
        });
        return householdForMember(tx, userId, householdId)
          as unknown as Promise<HouseholdViewRecord | null>;
      });
    },

    async revokeShare(userId, householdId, shareId, now) {
      return prisma.$transaction(async (tx) => {
        const changed = await tx.householdRecordShare.updateMany({
          where: { id: shareId, householdId, ownerUserId: userId, revokedAt: null },
          data: { revokedAt: now },
        });
        if (changed.count !== 1) return null;
        await tx.auditEvent.create({
          data: safeAudit(
            userId, "HOUSEHOLD_RECORD_SHARE", shareId, "DELETED",
            "HOUSEHOLD_RECORD_SHARE_REVOKED",
          ),
        });
        return householdForMember(tx, userId, householdId)
          as unknown as Promise<HouseholdViewRecord | null>;
      });
    },
  };
}

type RuntimeOptions = { runtimeEnabled?: boolean };

function requireRuntime(options: RuntimeOptions) {
  if (!(options.runtimeEnabled ?? PHASE_10_COLLABORATION_RUNTIME_ENABLED)) {
    throw new HouseholdUnavailableError();
  }
}

function toView(record: HouseholdViewRecord) {
  return {
    id: record.id,
    name: record.name,
    status: record.status,
    members: record.memberships.map(({ id, role }) => ({ id, role })),
    sharedRecords: record.shares.map(({ id, entityType }) => ({ id, entityType })),
  };
}

export async function listHouseholds(
  context: AuthenticatedUserContext | null | undefined,
  store?: HouseholdStore,
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  return (await (store ?? createPrismaHouseholdStore()).listForMember(user.userId)).map(toView);
}

export async function mutateHousehold(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  store?: HouseholdStore,
  now = new Date(),
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const request = householdMutationSchema.parse(input);
  const resolvedStore = store ?? createPrismaHouseholdStore();
  let household: HouseholdViewRecord | null = null;

  if (request.action === "CREATE") {
    household = await resolvedStore.create(user.userId, request.name, now);
  } else if (request.action === "INVITE") {
    const expiresAt = new Date(request.expiresAt);
    if (expiresAt <= now) throw new HouseholdConflictError("Choose a future invitation expiry.");
    const token = randomBytes(32).toString("base64url");
    const created = await resolvedStore.createInvitation(
      user.userId, request.householdId, request.role, hashToken(token),
      request.intendedIdentityHash, expiresAt, now,
    );
    if (!created) throw new HouseholdConflictError();
    return { type: "INVITATION" as const, invitationId: created.id, token };
  } else if (request.action === "ACCEPT_INVITATION") {
    household = await resolvedStore.acceptInvitation(
      user.userId, hashToken(request.token), request.identityHash, now,
    );
  } else if (request.action === "SET_ROLE") {
    household = await resolvedStore.setRole(
      user.userId, request.householdId, request.membershipId, request.role,
    );
  } else if (request.action === "END_MEMBERSHIP") {
    const result = await resolvedStore.endMembership(
      user.userId, request.householdId, request.membershipId, request.status, now,
    );
    if (!result.ended) throw new HouseholdConflictError();
    if (request.status === "LEFT") return { type: "LEFT" as const };
    household = result.household;
  } else if (request.action === "SHARE") {
    household = await resolvedStore.shareRecord(
      user.userId, request.householdId, request.entityType, request.entityId, now,
    );
  } else {
    household = await resolvedStore.revokeShare(
      user.userId, request.householdId, request.shareId, now,
    );
  }

  if (!household) throw new HouseholdConflictError();
  return { type: "HOUSEHOLD" as const, household: toView(household) };
}
