"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import type { ManualTransactionDraft } from "@/lib/manual-transactions";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  createDurableManualTransaction,
  listDurableManualTransactions,
  softDeleteDurableManualTransaction,
  updateDurableManualTransaction,
} from "@/src/server/manual-transactions";

function safeActionError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Check the transaction details and try again.";
  }

  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return "Sign in to save manual transactions to your SpendGrove account.";
    }

    if (error.name === "OwnershipError") {
      return "That transaction could not be found for your account.";
    }

    if (error.message === "Choose an approved category that matches the transaction type.") {
      return error.message;
    }
  }

  return "We could not save that transaction safely. Please check the details and try again.";
}

async function getAuthenticatedUserContext() {
  return getCurrentUserContext();
}

export async function listManualTransactionsAction() {
  try {
    const context = await getAuthenticatedUserContext();
    const transactions = await listDurableManualTransactions(context);
    return { ok: true as const, transactions };
  } catch (error) {
    return { ok: false as const, error: safeActionError(error) };
  }
}

export async function createManualTransactionAction(draft: ManualTransactionDraft) {
  try {
    const context = await getAuthenticatedUserContext();
    await createDurableManualTransaction(context, draft);
    const transactions = await listDurableManualTransactions(context);
    revalidatePath("/transactions");
    return { ok: true as const, transactions };
  } catch (error) {
    return { ok: false as const, error: safeActionError(error) };
  }
}

export async function updateManualTransactionAction(transactionId: string, draft: ManualTransactionDraft) {
  try {
    const context = await getAuthenticatedUserContext();
    await updateDurableManualTransaction(context, transactionId, draft);
    const transactions = await listDurableManualTransactions(context);
    revalidatePath("/transactions");
    return { ok: true as const, transactions };
  } catch (error) {
    return { ok: false as const, error: safeActionError(error) };
  }
}

export async function deleteManualTransactionAction(transactionId: string) {
  try {
    const context = await getAuthenticatedUserContext();
    await softDeleteDurableManualTransaction(context, transactionId);
    const transactions = await listDurableManualTransactions(context);
    revalidatePath("/transactions");
    return { ok: true as const, transactions };
  } catch (error) {
    return { ok: false as const, error: safeActionError(error) };
  }
}
