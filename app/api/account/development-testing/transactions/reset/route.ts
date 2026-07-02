import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { resetTransactionsForDevelopment } from "@/src/server/development-transaction-reset";
import { isDevelopmentTestingEnvironment } from "@/src/server/development-testing";

export const dynamic = "force-dynamic";

function safeError(error: unknown) {
  if (error instanceof ZodError) {
    return "Type DELETE TRANSACTIONS exactly before running this development reset.";
  }

  if (error instanceof Error && (
    error.name === "CurrentUserAuthenticationError"
    || error.name === "AuthenticationRequiredError"
  )) {
    return "Sign in before running this development reset.";
  }

  return "The development transaction reset could not be completed safely.";
}

export async function POST(request: Request) {
  if (!isDevelopmentTestingEnvironment()) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  try {
    const context = await getCurrentUserContext();
    const input = await request.json();
    const summary = await resetTransactionsForDevelopment(context, input);
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}
