import { auth, reverificationErrorResponse } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { deleteSpendGroveAccount } from "@/src/server/account-deletion";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  DESTRUCTIVE_CONFIRMATION_REQUEST_BYTES,
  readBoundedJson,
  SafeRequestBodyError,
} from "@/src/server/request-body";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" };

export async function POST(request: Request) {
  try {
    const { has } = await auth();
    if (!has({ reverification: "strict" })) {
      return reverificationErrorResponse("strict");
    }

    const input = await readBoundedJson(request, DESTRUCTIVE_CONFIRMATION_REQUEST_BYTES);
    const context = await getCurrentUserContext();
    const result = await deleteSpendGroveAccount(context, input);

    return NextResponse.json(result, {
      status: result.ok ? 200 : 502,
      headers: noStoreHeaders,
    });
  } catch (error) {
    const authenticationError = error instanceof Error
      && (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError");
    const ownershipError = error instanceof Error && error.name === "AccountDeletionOwnershipError";
    const requestBodyError = error instanceof SafeRequestBodyError ? error : null;
    const status = authenticationError
      ? 401
      : requestBodyError
        ? requestBodyError.status
        : error instanceof ZodError
          ? 400
          : ownershipError
            ? 409
            : 500;
    const message = authenticationError
      ? "Sign in again before deleting your account."
      : requestBodyError
        ? requestBodyError.status === 413
          ? "The account deletion request is too large. Nothing was changed."
          : "The account deletion confirmation could not be read safely. Nothing was changed."
        : error instanceof ZodError
          ? "Type DELETE to confirm permanent account deletion."
          : ownershipError
            ? "The signed-in account could not be matched safely. Nothing was deleted."
            : "Your account could not be deleted. Nothing was changed. Please try again.";

    return NextResponse.json(
      { ok: false, appDataDeleted: false, identityDeleted: false, error: message },
      { status, headers: noStoreHeaders },
    );
  }
}
