import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  LoanReconciliationConflictError,
  LoanReconciliationValidationError,
  linkLoanRepayment,
  unlinkLoanRepayment,
} from "@/src/server/loan-reconciliation-links";

function safeError(error: unknown) {
  if (error instanceof ZodError) return { status: 400, message: error.issues[0]?.message ?? "Check this link and try again." };
  if (error instanceof LoanReconciliationConflictError) return { status: 409, message: error.message };
  if (error instanceof LoanReconciliationValidationError) return { status: 400, message: error.message };
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") return { status: 401, message: "Sign in to manage repayment links." };
    if (error.name === "OwnershipError") return { status: 404, message: "That repayment or transaction is not available for your account." };
  }
  return { status: 400, message: "We could not update this repayment link safely." };
}

export async function POST(request: Request, { params }: { params: { repaymentId: string } }) {
  try {
    const link = await linkLoanRepayment(await getCurrentUserContext(), params.repaymentId, await request.json());
    return NextResponse.json({ ok: true, link }, { status: 201 });
  } catch (error) {
    const safe = safeError(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}

export async function DELETE(_request: Request, { params }: { params: { repaymentId: string } }) {
  try {
    const result = await unlinkLoanRepayment(await getCurrentUserContext(), params.repaymentId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const safe = safeError(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
