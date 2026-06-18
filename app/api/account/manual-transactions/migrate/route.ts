import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { manualTransactionMigrationRequestSchema } from "@/lib/manual-transaction-migration";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { migrateDurableManualTransactions } from "@/src/server/manual-transactions";

export const dynamic = "force-dynamic";

function safeMigrationError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Check the saved manual transactions and try again.";
  }
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return "Sign in before moving manual transactions to your SpendGrove account.";
    }
    if (error.message === "Choose an approved category that matches the transaction type.") return error.message;
    if (/private banking identifiers/i.test(error.message)) return error.message;
  }
  return "We could not move those manual transactions safely. Your device copy was not changed.";
}

export async function POST(request: Request) {
  try {
    const payload = manualTransactionMigrationRequestSchema.parse(await request.json());
    const result = await migrateDurableManualTransactions(await getCurrentUserContext(), payload.transactions);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeMigrationError(error) }, { status: 400 });
  }
}
