import { createHash, randomBytes } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import { isVerifiedPreviewRuntime } from "@/src/server/preview-runtime";

export type AccountantScopeType =
  | "REPORT" | "TRANSACTION" | "PROPERTY" | "LOAN_ACCOUNT"
  | "CATEGORY_BUDGET" | "RECURRING_ITEM" | "SAVINGS_GOAL" | "NET_WORTH_SNAPSHOT";

type GrantRecord = {
  id: string;
  ownerUserId: string;
  accountantUserId: string | null;
  status: "PENDING" | "ACTIVE" | "REVOKED" | "EXPIRED";
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  scopes: Array<{
    id: string;
    scopeType: AccountantScopeType;
    scopeKey: string;
    entityId: string | null;
    revokedAt: Date | null;
  }>;
};

export type AccountantScopeAuthorization = {
  ownerUserId: string;
  scopeType: AccountantScopeType;
  scopeKey: string;
  entityId: string | null;
};

export type AccountantAccessStore = {
  listOwned(ownerUserId: string): Promise<GrantRecord[]>;
  listAccepted(accountantUserId: string, now: Date): Promise<GrantRecord[]>;
  createGrant(
    ownerUserId: string,
    tokenHash: string,
    intendedIdentityHash: string | null,
    expiresAt: Date,
    now: Date,
  ): Promise<{ id: string }>;
  acceptGrant(
    accountantUserId: string,
    tokenHash: string,
    identityHash: string | null,
    now: Date,
  ): Promise<GrantRecord | null>;
  addScope(
    ownerUserId: string,
    grantId: string,
    scopeType: AccountantScopeType,
    scopeKey: string,
    entityId: string | null,
    now: Date,
  ): Promise<GrantRecord | null>;
  revokeScope(
    ownerUserId: string,
    grantId: string,
    scopeId: string,
    now: Date,
  ): Promise<GrantRecord | null>;
  revokeGrant(
    ownerUserId: string,
    grantId: string,
    now: Date,
  ): Promise<boolean>;
  authorizeScope(
    accountantUserId: string,
    scopeType: AccountantScopeType,
    scopeKey: string,
    entityId: string | null,
    now: Date,
  ): Promise<AccountantScopeAuthorization | null>;
};

export class AccountantAccessUnavailableError extends Error {
  constructor() {
    super("Accountant access is not available until the Preview migration is verified.");
    this.name = "AccountantAccessUnavailableError";
  }
}

export class AccountantAccessConflictError extends Error {
  constructor(message = "That accountant access action is no longer available.") {
    super(message);
    this.name = "AccountantAccessConflictError";
  }
}

const idSchema = z.string().trim().min(1).max(128);
const identityHashSchema = z.string().regex(/^[a-f0-9]{64}$/).nullable();
const reportKeySchema = z.enum(["monthly", "loan", "property", "accountant-pack"]);

const recordScopeSchema = z.object({
  action: z.literal("ADD_SCOPE"),
  grantId: idSchema,
  scopeType: z.enum([
    "TRANSACTION", "PROPERTY", "LOAN_ACCOUNT", "CATEGORY_BUDGET",
    "RECURRING_ITEM", "SAVINGS_GOAL", "NET_WORTH_SNAPSHOT",
  ]),
  entityId: idSchema,
}).strict();

const reportScopeSchema = z.object({
  action: z.literal("ADD_SCOPE"),
  grantId: idSchema,
  scopeType: z.literal("REPORT"),
  reportKey: reportKeySchema,
}).strict();

export const accountantAccessMutationSchema = z.union([
  z.object({
    action: z.literal("CREATE_GRANT"),
    intendedIdentityHash: identityHashSchema.default(null),
    expiresAt: z.string().datetime(),
  }).strict(),
  z.object({
    action: z.literal("ACCEPT_GRANT"),
    token: z.string().min(32).max(256),
    identityHash: identityHashSchema.default(null),
  }).strict(),
  recordScopeSchema,
  reportScopeSchema,
  z.object({
    action: z.literal("REVOKE_SCOPE"),
    grantId: idSchema,
    scopeId: idSchema,
  }).strict(),
  z.object({
    action: z.literal("REVOKE_GRANT"),
    grantId: idSchema,
  }).strict(),
]);

export const accountantScopeRequestSchema = z.union([
  z.object({
    scopeType: z.literal("REPORT"),
    reportKey: reportKeySchema,
  }).strict(),
  z.object({
    scopeType: z.enum([
      "TRANSACTION", "PROPERTY", "LOAN_ACCOUNT", "CATEGORY_BUDGET",
      "RECURRING_ITEM", "SAVINGS_GOAL", "NET_WORTH_SNAPSHOT",
    ]),
    entityId: idSchema,
  }).strict(),
]);

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeAudit(
  userId: string,
  entityType: "ACCOUNTANT_ACCESS_GRANT" | "ACCOUNTANT_ACCESS_SCOPE",
  entityId: string,
  action: "CREATED" | "UPDATED" | "DELETED",
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

const grantInclude = {
  scopes: {
    where: { revokedAt: null },
    select: {
      id: true,
      scopeType: true,
      scopeKey: true,
      entityId: true,
      revokedAt: true,
    },
    orderBy: [{ scopeType: "asc" }, { scopeKey: "asc" }],
  },
} satisfies Prisma.AccountantAccessGrantInclude;

async function validateOwnedSource(
  tx: Prisma.TransactionClient,
  ownerUserId: string,
  scopeType: AccountantScopeType,
  entityId: string,
) {
  if (scopeType === "TRANSACTION") {
    return Boolean(await tx.transaction.findFirst({
      where: { id: entityId, userId: ownerUserId, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    }));
  }
  if (scopeType === "PROPERTY") {
    return Boolean(await tx.property.findFirst({
      where: { id: entityId, userId: ownerUserId, isArchived: false, deletedAt: null },
      select: { id: true },
    }));
  }
  if (scopeType === "LOAN_ACCOUNT") {
    return Boolean(await tx.loanAccount.findFirst({
      where: { id: entityId, userId: ownerUserId, isArchived: false, deletedAt: null },
      select: { id: true },
    }));
  }
  if (scopeType === "CATEGORY_BUDGET") {
    return Boolean(await tx.categoryBudget.findFirst({
      where: { id: entityId, userId: ownerUserId, status: "ACTIVE" },
      select: { id: true },
    }));
  }
  if (scopeType === "RECURRING_ITEM") {
    return Boolean(await tx.recurringItem.findFirst({
      where: { id: entityId, userId: ownerUserId, status: { not: "ARCHIVED" } },
      select: { id: true },
    }));
  }
  if (scopeType === "SAVINGS_GOAL") {
    return Boolean(await tx.savingsGoal.findFirst({
      where: { id: entityId, userId: ownerUserId, status: { not: "ARCHIVED" } },
      select: { id: true },
    }));
  }
  return Boolean(await tx.netWorthSnapshot.findFirst({
    where: { id: entityId, userId: ownerUserId, archivedAt: null },
    select: { id: true },
  }));
}

export function createPrismaAccountantAccessStore(
  prisma: PrismaClient = getPrismaClient(),
): AccountantAccessStore {
  return {
    async listOwned(ownerUserId) {
      return (await prisma.accountantAccessGrant.findMany({
        where: { ownerUserId },
        include: grantInclude,
        orderBy: { createdAt: "desc" },
      })) as unknown as GrantRecord[];
    },

    async listAccepted(accountantUserId, now) {
      return (await prisma.accountantAccessGrant.findMany({
        where: {
          accountantUserId,
          status: "ACTIVE",
          revokedAt: null,
          expiresAt: { gt: now },
        },
        include: grantInclude,
        orderBy: { createdAt: "desc" },
      })) as unknown as GrantRecord[];
    },

    async createGrant(ownerUserId, tokenHash, intendedIdentityHash, expiresAt, now) {
      const grant = await prisma.$transaction(async (tx) => {
        const created = await tx.accountantAccessGrant.create({
          data: {
            ownerUserId,
            tokenHash,
            intendedIdentityHash,
            status: "PENDING",
            expiresAt,
            createdAt: now,
          },
          select: { id: true },
        });
        await tx.auditEvent.create({
          data: safeAudit(
            ownerUserId,
            "ACCOUNTANT_ACCESS_GRANT",
            created.id,
            "CREATED",
            "ACCOUNTANT_GRANT_CREATED",
          ),
        });
        return created;
      });
      return grant;
    },

    async acceptGrant(accountantUserId, tokenHash, identityHash, now) {
      return prisma.$transaction(async (tx) => {
        const grant = await tx.accountantAccessGrant.findUnique({ where: { tokenHash } });
        if (
          !grant
          || grant.ownerUserId === accountantUserId
          || grant.status !== "PENDING"
          || grant.expiresAt <= now
          || (grant.intendedIdentityHash && grant.intendedIdentityHash !== identityHash)
        ) return null;
        const changed = await tx.accountantAccessGrant.updateMany({
          where: { id: grant.id, status: "PENDING", accountantUserId: null },
          data: { status: "ACTIVE", accountantUserId, acceptedAt: now },
        });
        if (changed.count !== 1) throw new AccountantAccessConflictError();
        await tx.auditEvent.create({
          data: safeAudit(
            accountantUserId,
            "ACCOUNTANT_ACCESS_GRANT",
            grant.id,
            "UPDATED",
            "ACCOUNTANT_GRANT_ACCEPTED",
          ),
        });
        return (await tx.accountantAccessGrant.findUnique({
          where: { id: grant.id },
          include: grantInclude,
        })) as unknown as GrantRecord | null;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },

    async addScope(ownerUserId, grantId, scopeType, scopeKey, entityId, now) {
      return prisma.$transaction(async (tx) => {
        const grant = await tx.accountantAccessGrant.findFirst({
          where: {
            id: grantId,
            ownerUserId,
            status: { in: ["PENDING", "ACTIVE"] },
            revokedAt: null,
            expiresAt: { gt: now },
          },
        });
        if (!grant) return null;
        if (scopeType !== "REPORT") {
          if (!entityId || !await validateOwnedSource(tx, ownerUserId, scopeType, entityId)) {
            return null;
          }
        }
        const scope = await tx.accountantAccessScope.upsert({
          where: { grantId_scopeType_scopeKey: { grantId, scopeType, scopeKey } },
          create: { grantId, ownerUserId, scopeType, scopeKey, entityId, sharedAt: now },
          update: { entityId, revokedAt: null, sharedAt: now },
        });
        await tx.auditEvent.create({
          data: safeAudit(
            ownerUserId,
            "ACCOUNTANT_ACCESS_SCOPE",
            scope.id,
            "CREATED",
            "ACCOUNTANT_SCOPE_SHARED",
          ),
        });
        return (await tx.accountantAccessGrant.findUnique({
          where: { id: grantId },
          include: grantInclude,
        })) as unknown as GrantRecord | null;
      });
    },

    async revokeScope(ownerUserId, grantId, scopeId, now) {
      return prisma.$transaction(async (tx) => {
        const changed = await tx.accountantAccessScope.updateMany({
          where: { id: scopeId, grantId, ownerUserId, revokedAt: null },
          data: { revokedAt: now },
        });
        if (changed.count !== 1) return null;
        await tx.auditEvent.create({
          data: safeAudit(
            ownerUserId,
            "ACCOUNTANT_ACCESS_SCOPE",
            scopeId,
            "DELETED",
            "ACCOUNTANT_SCOPE_REVOKED",
          ),
        });
        return (await tx.accountantAccessGrant.findFirst({
          where: { id: grantId, ownerUserId },
          include: grantInclude,
        })) as unknown as GrantRecord | null;
      });
    },

    async revokeGrant(ownerUserId, grantId, now) {
      return prisma.$transaction(async (tx) => {
        const changed = await tx.accountantAccessGrant.updateMany({
          where: {
            id: grantId,
            ownerUserId,
            status: { in: ["PENDING", "ACTIVE"] },
            revokedAt: null,
          },
          data: { status: "REVOKED", revokedAt: now },
        });
        if (changed.count !== 1) return false;
        await tx.accountantAccessScope.updateMany({
          where: { grantId, ownerUserId, revokedAt: null },
          data: { revokedAt: now },
        });
        await tx.auditEvent.create({
          data: safeAudit(
            ownerUserId,
            "ACCOUNTANT_ACCESS_GRANT",
            grantId,
            "DELETED",
            "ACCOUNTANT_GRANT_REVOKED",
          ),
        });
        return true;
      });
    },

    async authorizeScope(accountantUserId, scopeType, scopeKey, entityId, now) {
      const scope = await prisma.accountantAccessScope.findFirst({
        where: {
          scopeType,
          scopeKey,
          entityId,
          revokedAt: null,
          grant: {
            accountantUserId,
            status: "ACTIVE",
            revokedAt: null,
            expiresAt: { gt: now },
          },
        },
        select: { ownerUserId: true, scopeType: true, scopeKey: true, entityId: true },
      });
      return scope as AccountantScopeAuthorization | null;
    },
  };
}

type RuntimeOptions = { runtimeEnabled?: boolean };

function requireRuntime(options: RuntimeOptions) {
  if (!(options.runtimeEnabled ?? isVerifiedPreviewRuntime())) {
    throw new AccountantAccessUnavailableError();
  }
}

function toView(record: GrantRecord, perspective: "OWNER" | "ACCOUNTANT") {
  return {
    id: record.id,
    perspective,
    status: record.status,
    expiresAt: record.expiresAt,
    accepted: Boolean(record.acceptedAt),
    scopes: record.scopes.map(({ id, scopeType, scopeKey }) => ({
      id,
      scopeType,
      scopeKey,
    })),
  };
}

function resolveScope(
  request: z.infer<typeof recordScopeSchema> | z.infer<typeof reportScopeSchema>,
) {
  if (request.scopeType === "REPORT") {
    return {
      scopeType: request.scopeType as AccountantScopeType,
      scopeKey: request.reportKey,
      entityId: null,
    };
  }
  return {
    scopeType: request.scopeType as AccountantScopeType,
    scopeKey: `${request.scopeType}:${request.entityId}`,
    entityId: request.entityId,
  };
}

export async function listAccountantAccess(
  context: AuthenticatedUserContext | null | undefined,
  store?: AccountantAccessStore,
  now = new Date(),
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const resolvedStore = store ?? createPrismaAccountantAccessStore();
  const [owned, accepted] = await Promise.all([
    resolvedStore.listOwned(user.userId),
    resolvedStore.listAccepted(user.userId, now),
  ]);
  return {
    owned: owned.map((record) => toView(record, "OWNER")),
    accepted: accepted.map((record) => toView(record, "ACCOUNTANT")),
  };
}

export async function mutateAccountantAccess(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  store?: AccountantAccessStore,
  now = new Date(),
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const request = accountantAccessMutationSchema.parse(input);
  const resolvedStore = store ?? createPrismaAccountantAccessStore();

  if (request.action === "CREATE_GRANT") {
    const expiresAt = new Date(request.expiresAt);
    if (expiresAt <= now) throw new AccountantAccessConflictError("Choose a future access expiry.");
    const token = randomBytes(32).toString("base64url");
    const grant = await resolvedStore.createGrant(
      user.userId,
      hashToken(token),
      request.intendedIdentityHash,
      expiresAt,
      now,
    );
    return { type: "INVITATION" as const, grantId: grant.id, token };
  }

  if (request.action === "ACCEPT_GRANT") {
    const grant = await resolvedStore.acceptGrant(
      user.userId,
      hashToken(request.token),
      request.identityHash,
      now,
    );
    if (!grant) throw new AccountantAccessConflictError();
    return { type: "GRANT" as const, grant: toView(grant, "ACCOUNTANT") };
  }

  if (request.action === "ADD_SCOPE") {
    const scope = resolveScope(request);
    const grant = await resolvedStore.addScope(
      user.userId,
      request.grantId,
      scope.scopeType,
      scope.scopeKey,
      scope.entityId,
      now,
    );
    if (!grant) throw new AccountantAccessConflictError();
    return { type: "GRANT" as const, grant: toView(grant, "OWNER") };
  }

  if (request.action === "REVOKE_SCOPE") {
    const grant = await resolvedStore.revokeScope(
      user.userId,
      request.grantId,
      request.scopeId,
      now,
    );
    if (!grant) throw new AccountantAccessConflictError();
    return { type: "GRANT" as const, grant: toView(grant, "OWNER") };
  }

  const revoked = await resolvedStore.revokeGrant(
    user.userId,
    request.grantId,
    now,
  );
  if (!revoked) throw new AccountantAccessConflictError();
  return { type: "REVOKED" as const };
}

export async function authorizeAccountantScope(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  store?: AccountantAccessStore,
  now = new Date(),
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const request = accountantScopeRequestSchema.parse(input);
  const scope = resolveScope({
    action: "ADD_SCOPE",
    grantId: "authorization",
    ...request,
  } as z.infer<typeof recordScopeSchema> | z.infer<typeof reportScopeSchema>);
  const authorization = await (store ?? createPrismaAccountantAccessStore()).authorizeScope(
    user.userId,
    scope.scopeType,
    scope.scopeKey,
    scope.entityId,
    now,
  );
  if (!authorization) throw new AccountantAccessConflictError("That access is not available.");
  return authorization;
}
