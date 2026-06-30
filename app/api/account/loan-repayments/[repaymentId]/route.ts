import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  LoanRepaymentArchiveConflictError,
  LoanRepaymentCorrectionConflictError,
  LoanRepaymentCorrectionNoChangesError,
  LoanRepaymentCorrectionStateError,
  correctLoanRepayment,
  updateLoanRepaymentArchiveState,
} from "@/src/server/loan-repayment-history";

function safeError(error: unknown) {
  if (error instanceof ZodError) return { status: 400, message: error.issues[0]?.message ?? "Check that repayment change." };
  if (error instanceof LoanRepaymentArchiveConflictError) return { status: 409, message: error.message };
  if (error instanceof LoanRepaymentCorrectionConflictError || error instanceof LoanRepaymentCorrectionStateError) return { status: 409, message: error.message };
  if (error instanceof LoanRepaymentCorrectionNoChangesError) return { status: 400, message: error.message };
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") return { status: 401, message: "Sign in to manage repayment history." };
    if (error.name === "OwnershipError") return { status: 404, message: "That repayment is not available for your account." };
  }
  return { status: 400, message: "We could not update that repayment safely." };
}

export async function PUT(request: Request, { params }: { params: { repaymentId: string } }) {
  try {
    const repayment = await correctLoanRepayment(
      await getCurrentUserContext(),
      params.repaymentId,
      await request.json(),
    );
    return NextResponse.json({ ok: true, repayment });
  } catch (error) {
    const safe = safeError(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}

export async function PATCH(request: Request, { params }: { params: { repaymentId: string } }) {
  try {
    const repayment = await updateLoanRepaymentArchiveState(
      await getCurrentUserContext(),
      params.repaymentId,
      await request.json(),
    );
    return NextResponse.json({ ok: true, repayment });
  } catch (error) {
    const safe = safeError(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
