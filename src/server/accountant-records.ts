import { type PrismaClient } from "@prisma/client";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import {
  createPrismaHouseholdRecordStore,
  resolvePurposeLimitedRecordSummary,
  type HouseholdRecordSummary,
} from "@/src/server/household-records";
import type { HouseholdShareType } from "@/src/server/households";
import { isVerifiedPreviewRuntime } from "@/src/server/preview-runtime";

export type AccountantReadableRecord = HouseholdRecordSummary & {
  grantId: string;
  scopeId: string;
};

export type AccountantRecordStore = {
  listOwnedCandidates(userId: string): Promise<HouseholdRecordSummary[]>;
  listReadableRecords(accountantUserId: string, now: Date): Promise<AccountantReadableRecord[]>;
};

export class AccountantRecordsUnavailableError extends Error {
  constructor() {
    super("Accountant records are available only in the verified Preview environment.");
    this.name = "AccountantRecordsUnavailableError";
  }
}

export function createPrismaAccountantRecordStore(
  prisma: PrismaClient = getPrismaClient(),
): AccountantRecordStore {
  return {
    async listOwnedCandidates(userId) {
      return createPrismaHouseholdRecordStore(prisma).listOwnedCandidates(userId);
    },

    async listReadableRecords(accountantUserId, now) {
      return prisma.$transaction(async (tx) => {
        const scopes = await tx.accountantAccessScope.findMany({
          where: {
            revokedAt: null,
            grant: {
              accountantUserId,
              status: "ACTIVE",
              revokedAt: null,
              expiresAt: { gt: now },
            },
          },
          orderBy: [{ scopeType: "asc" }, { scopeKey: "asc" }],
          select: {
            id: true,
            grantId: true,
            ownerUserId: true,
            scopeType: true,
            scopeKey: true,
            entityId: true,
          },
        });
        const records = await Promise.all(scopes.map(async (scope) => {
          const entityType = scope.scopeType as HouseholdShareType;
          const entityId = entityType === "REPORT" ? scope.scopeKey : scope.entityId;
          if (!entityId) return null;
          const summary = await resolvePurposeLimitedRecordSummary(
            tx,
            scope.ownerUserId,
            entityType,
            entityId,
          );
          return summary ? {
            ...summary,
            grantId: scope.grantId,
            scopeId: scope.id,
          } : null;
        }));
        return records.filter((entry): entry is AccountantReadableRecord => Boolean(entry));
      });
    },
  };
}

type RuntimeOptions = { runtimeEnabled?: boolean };

export async function getAccountantRecordWorkspace(
  context: AuthenticatedUserContext | null | undefined,
  store: AccountantRecordStore = createPrismaAccountantRecordStore(),
  now = new Date(),
  options: RuntimeOptions = {},
) {
  if (!(options.runtimeEnabled ?? isVerifiedPreviewRuntime())) {
    throw new AccountantRecordsUnavailableError();
  }
  const user = requireAuthenticatedUserContext(context);
  const [candidates, readableRecords] = await Promise.all([
    store.listOwnedCandidates(user.userId),
    store.listReadableRecords(user.userId, now),
  ]);
  return { candidates, readableRecords };
}
