import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  BulkOperationsUnavailableError,
  createBulkOperation,
} from "@/src/server/bulk-operations";
import { readBoundedJson, SafeRequestBodyError } from "@/src/server/request-body";

export const dynamic = "force-dynamic";

const BULK_OPERATION_REQUEST_BYTES = 64 * 1024;

function safeError(error: unknown) {
  if (error instanceof BulkOperationsUnavailableError) return error.message;
  if (error instanceof SafeRequestBodyError) {
    return error.code === "REQUEST_BODY_TOO_LARGE"
      ? "That bulk request is too large."
      : "Check the selected transactions and try again.";
  }
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Check the selected transactions and try again.";
  }
  if (error instanceof Error && (
    error.name === "CurrentUserAuthenticationError" ||
    error.name === "AuthenticationRequiredError"
  )) {
    return "Sign in to update account transactions.";
  }
  if (error instanceof Error && error.message === "CATEGORY_UNAVAILABLE") {
    return "Choose an available category.";
  }
  if (error instanceof Error && error.message === "PROPERTY_UNAVAILABLE") {
    return "Choose an available Property.";
  }
  return "The bulk change could not be completed safely.";
}

function statusFor(error: unknown) {
  if (error instanceof BulkOperationsUnavailableError) return 503;
  if (error instanceof SafeRequestBodyError) return error.status;
  if (error instanceof Error && (
    error.name === "CurrentUserAuthenticationError" ||
    error.name === "AuthenticationRequiredError"
  )) return 401;
  return 400;
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const input = await readBoundedJson(request, BULK_OPERATION_REQUEST_BYTES);
    const operation = await createBulkOperation(context, input);
    return NextResponse.json({ ok: true, operation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: statusFor(error) });
  }
}
