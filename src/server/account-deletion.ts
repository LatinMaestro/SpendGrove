import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import { isVerifiedPreviewRuntime } from "@/src/server/preview-runtime";

export const accountDeletionInputSchema = z.object({
  confirmation: z.literal("DELETE", {
    errorMap: () => ({ message: "Type DELETE to confirm permanent account deletion." }),
  }),
}).strict();

export type AccountDeletionInput = z.infer<typeof accountDeletionInputSchema>;

export type AccountDataDeletionStore = {
  deleteOwnerData(userId: string, providerUserId: string): Promise<void>;
};

export type ClerkIdentityDeletionStore = {
  deleteIdentity(providerUserId: string): Promise<void>;
};

export type AccountDeletionResult = {
  ok: boolean;
  appDataDeleted: boolean;
  identityDeleted: boolean;
  stateCode: "ACCOUNT_DELETED" | "IDENTITY_DELETION_RETRY_REQUIRED";
  message: string;
};

export class AccountDeletionOwnershipError extends Error {
  constructor() {
    super("The signed-in account could not be matched safely.");
    this.name = "AccountDeletionOwnershipError";
  }
}

const defaultDataStore: AccountDataDeletionStore = {
  async deleteOwnerData(userId, providerUserId) {
    const db = getPrismaClient();
    await db.$transaction(async (transaction) => {
      await transaction.auditEvent.deleteMany({ where: { userId } });
      if (isVerifiedPreviewRuntime()) {
        await transaction.recurringInstance.deleteMany({ where: { userId } });
        await transaction.netWorthSnapshotEntry.deleteMany({ where: { userId } });
        await transaction.netWorthSnapshot.deleteMany({ where: { userId } });
        await transaction.netWorthValuation.deleteMany({ where: { userId } });
        await transaction.netWorthItem.deleteMany({ where: { userId } });
        await transaction.savingsGoalContribution.deleteMany({ where: { userId } });
        await transaction.savingsGoal.deleteMany({ where: { userId } });
        await transaction.importUndoItem.deleteMany({ where: { userId } });
        await transaction.importUndoOperation.deleteMany({ where: { userId } });
        await transaction.transferLink.deleteMany({ where: { userId } });
        await transaction.bulkOperationItem.deleteMany({ where: { userId } });
        await transaction.bulkOperation.deleteMany({ where: { userId } });
      }
      await transaction.propertyReportReview.deleteMany({ where: { userId } });
      await transaction.propertyTransactionLink.deleteMany({ where: { userId } });
      await transaction.loanReconciliationLink.deleteMany({ where: { userId } });
      await transaction.loanRepayment.deleteMany({ where: { userId } });
      await transaction.categoryBudget.deleteMany({ where: { userId } });
      await transaction.recurringItem.deleteMany({ where: { userId } });
      await transaction.recurringSuggestionDismissal.deleteMany({ where: { userId } });
      await transaction.importRow.deleteMany({ where: { userId } });
      await transaction.merchantAlias.deleteMany({ where: { userId } });
      await transaction.merchantRule.deleteMany({ where: { userId } });
      await transaction.transaction.deleteMany({ where: { userId } });
      await transaction.importBatch.deleteMany({ where: { userId } });
      await transaction.loanAccount.deleteMany({ where: { userId } });
      await transaction.property.deleteMany({ where: { userId } });
      await transaction.merchantProfile.deleteMany({ where: { userId } });
      await transaction.bankImportProfile.deleteMany({ where: { userId } });
      await transaction.category.deleteMany({ where: { userId } });
      await transaction.userSettings.deleteMany({ where: { userId } });

      const deletedUser = await transaction.user.deleteMany({
        where: {
          id: userId,
          authProvider: "CLERK",
          authProviderUserId: providerUserId,
        },
      });
      if (deletedUser.count !== 1) throw new AccountDeletionOwnershipError();
    });
  },
};

const defaultIdentityStore: ClerkIdentityDeletionStore = {
  async deleteIdentity(providerUserId) {
    const client = await clerkClient();
    await client.users.deleteUser(providerUserId);
  },
};

export async function deleteSpendGroveAccount(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  dataStore: AccountDataDeletionStore = defaultDataStore,
  identityStore: ClerkIdentityDeletionStore = defaultIdentityStore,
): Promise<AccountDeletionResult> {
  const user = requireAuthenticatedUserContext(context);
  accountDeletionInputSchema.parse(input);

  await dataStore.deleteOwnerData(user.userId, user.providerUserId);

  try {
    await identityStore.deleteIdentity(user.providerUserId);
    return {
      ok: true,
      appDataDeleted: true,
      identityDeleted: true,
      stateCode: "ACCOUNT_DELETED",
      message: "Your SpendGrove account and account data have been deleted.",
    };
  } catch {
    return {
      ok: false,
      appDataDeleted: true,
      identityDeleted: false,
      stateCode: "IDENTITY_DELETION_RETRY_REQUIRED",
      message: "Your SpendGrove records were deleted, but sign-in account removal could not finish. Please try again.",
    };
  }
}
