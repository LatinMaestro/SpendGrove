import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  createLoanAccount,
  listLoanMetadata,
  type LoanAccountCreateInput,
} from "@/src/server/loan-metadata";

export const dynamic = "force-dynamic";

function safeError(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Check the loan details and try again.";
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return "Sign in to manage loans.";
    }
    if (error.name === "OwnershipError") return "That loan or property could not be found for your account.";
    if (/private bank identifier/i.test(error.message) || error.message === "Choose an active property.") return error.message;
  }
  return "We could not save that loan safely. Please try again.";
}

export async function GET() {
  try {
    const context = await getCurrentUserContext();
    return NextResponse.json({ ok: true, ...(await listLoanMetadata(context)) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const input = await request.json() as LoanAccountCreateInput;
    return NextResponse.json({ ok: true, ...(await createLoanAccount(context, input)) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}
