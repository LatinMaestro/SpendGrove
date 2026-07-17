import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { importCommitRequestSchema } from "@/lib/import-commit";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { ImportCommitConflictError, commitReviewedImport } from "@/src/server/import-commit";
import {
  LARGE_REVIEW_REQUEST_BYTES,
  readBoundedJson,
  SafeRequestBodyError,
} from "@/src/server/request-body";

export const dynamic = "force-dynamic";

function safeImportCommitError(error: unknown) {
  if (error instanceof SafeRequestBodyError) {
    return {
      status: error.status,
      message: error.status === 413
        ? "This reviewed import is too large to save in one request."
        : "The reviewed import request could not be read safely.",
    };
  }
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
    const input = await readBoundedJson(request, LARGE_REVIEW_REQUEST_BYTES);
    const payload = importCommitRequestSchema.parse(input);
    const summary = await commitReviewedImport(await getCurrentUserContext(), payload);
    return NextResponse.json({ ok: true, summary }, { status: summary.alreadyCommitted ? 200 : 201 });
  } catch (error) {
    const safe = safeImportCommitError(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
