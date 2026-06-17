import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ManualTransactionDraft } from "@/lib/manual-transactions";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  listDurableManualTransactions,
  softDeleteDurableManualTransaction,
  updateDurableManualTransaction,
} from "@/src/server/manual-transactions";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    transactionId: string;
  };
};

function safeApiError(error: unknown) {
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

function errorResponse(error: unknown, status = 400) {
  return NextResponse.json({ ok: false, error: safeApiError(error) }, { status });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const draft = await request.json() as ManualTransactionDraft;
    await updateDurableManualTransaction(context, params.transactionId, draft);
    const transactions = await listDurableManualTransactions(context);
    return NextResponse.json({ ok: true, transactions });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    await softDeleteDurableManualTransaction(context, params.transactionId);
    const transactions = await listDurableManualTransactions(context);
    return NextResponse.json({ ok: true, transactions });
  } catch (error) {
    return errorResponse(error);
  }
}
