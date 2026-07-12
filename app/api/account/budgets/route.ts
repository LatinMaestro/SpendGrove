import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  applyCategoryBudgetMutation,
  CategoryBudgetConflictError,
  CategoryBudgetDuplicateError,
  getCategoryBudgetSnapshot,
} from "@/src/server/category-budgets";

export const dynamic = "force-dynamic";

function safeBudgetError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Check the budget details and try again.";
  }
  if (error instanceof CategoryBudgetConflictError || error instanceof CategoryBudgetDuplicateError) {
    return error.message;
  }
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return "Sign in to manage category budgets.";
    }
    if (
      error.message === "Choose an active expense category."
      || error.message === "Restore is unavailable because this expense category is no longer active."
    ) return error.message;
  }
  return "We could not update category budgets safely. Refresh and try again.";
}

function errorResponse(error: unknown, status = 400) {
  return NextResponse.json({ ok: false, error: safeBudgetError(error) }, { status });
}

export async function GET() {
  try {
    const context = await getCurrentUserContext();
    const snapshot = await getCategoryBudgetSnapshot(context);
    return NextResponse.json({ ok: true, ...snapshot });
  } catch (error) {
    return errorResponse(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const snapshot = await applyCategoryBudgetMutation(context, await request.json());
    return NextResponse.json({ ok: true, ...snapshot });
  } catch (error) {
    return errorResponse(error);
  }
}
