import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  applyRecurringMutation,
  getRecurringSnapshot,
  RecurringItemDuplicateError,
} from "@/src/server/recurring-suggestions";

export const dynamic = "force-dynamic";

function safeRecurringError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Check the recurring item details and try again.";
  }
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return "Sign in to review recurring suggestions.";
    }
    if (
      error.name === "RecurringSuggestionUnavailableError"
      || error.name === "RecurringItemConflictError"
      || error instanceof RecurringItemDuplicateError
    ) {
      return error.message;
    }
    if (
      error.message === "Keep the expected amount direction consistent with the recurring transaction type."
      || error.message === "Choose a valid next expected date."
    ) {
      return error.message;
    }
  }
  return "We could not update recurring items safely. Refresh and try again.";
}

function errorResponse(error: unknown, status = 400) {
  return NextResponse.json({ ok: false, error: safeRecurringError(error) }, { status });
}

export async function GET() {
  try {
    const context = await getCurrentUserContext();
    const snapshot = await getRecurringSnapshot(context);
    return NextResponse.json({ ok: true, ...snapshot });
  } catch (error) {
    return errorResponse(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const snapshot = await applyRecurringMutation(context, await request.json());
    return NextResponse.json({ ok: true, ...snapshot });
  } catch (error) {
    return errorResponse(error);
  }
}
