import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { readBoundedJson, SafeRequestBodyError } from "@/src/server/request-body";
import {
  confirmTransferLink,
  TransferLinkConflictError,
  TransferLinkEligibilityError,
  TransferLinksUnavailableError,
} from "@/src/server/transfer-links";

export const dynamic = "force-dynamic";

function safeError(error: unknown) {
  if (
    error instanceof TransferLinksUnavailableError
    || error instanceof TransferLinkConflictError
    || error instanceof TransferLinkEligibilityError
  ) return error.message;
  if (error instanceof SafeRequestBodyError || error instanceof ZodError) {
    return "Check the selected transfers and try again.";
  }
  if (error instanceof Error && (
    error.name === "CurrentUserAuthenticationError"
    || error.name === "AuthenticationRequiredError"
  )) return "Sign in to link transfers.";
  return "The transfers could not be linked safely.";
}

function statusFor(error: unknown) {
  if (error instanceof TransferLinksUnavailableError) return 503;
  if (error instanceof TransferLinkConflictError) return 409;
  if (error instanceof Error && (
    error.name === "CurrentUserAuthenticationError"
    || error.name === "AuthenticationRequiredError"
  )) return 401;
  return 400;
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const input = await readBoundedJson(request, 16 * 1024);
    const transferLink = await confirmTransferLink(context, input);
    return NextResponse.json({ ok: true, transferLink }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: safeError(error) },
      { status: statusFor(error) },
    );
  }
}
