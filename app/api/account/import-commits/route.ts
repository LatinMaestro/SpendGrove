import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { importCommitRequestSchema } from "@/lib/import-commit";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { ImportCommitConflictError, commitReviewedImport } from "@/src/server/import-commit";

export const dynamic = "force-dynamic";

function safeImportCommitError(error: unknown) {
  if (error instanceof ZodError) {
    return { status: 400, message: error.issues[0]?.message ?? "Check the reviewed import and try again." };
  }
  if (error instanceof ImportCommitConflictError) {
    return { status: 409, message: error.message };
  }
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return { status: 401, message: "Sign in to save reviewed transactions to your SpendGrove account." };
    }
    if (error.name === "OwnershipError") {
      return { status: 404, message: "A selected transaction or category is not available for your account." };
    }
    if (/reviewed row|approved category|merge target|private banking identifiers/i.test(error.message)) {
      return { status: 400, message: error.message };
    }
  }
  return { status: 400, message: "We could not save this reviewed import safely. Nothing was partly saved. Please try again." };
}

export async function POST(request: Request) {
  try {
    const payload = importCommitRequestSchema.parse(await request.json());
    const summary = await commitReviewedImport(await getCurrentUserContext(), payload);
    return NextResponse.json({ ok: true, summary }, { status: summary.alreadyCommitted ? 200 : 201 });
  } catch (error) {
    const safe = safeImportCommitError(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
