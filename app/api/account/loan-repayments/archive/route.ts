import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  LoanRepaymentBulkArchiveConflictError,
  bulkUpdateLoanRepaymentArchiveState,
} from "@/src/server/loan-repayment-history";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const summary = await bulkUpdateLoanRepaymentArchiveState(
      await getCurrentUserContext(),
      await request.json(),
    );
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Check the repayment cleanup selection." }, { status: 400 });
    }
    if (error instanceof LoanRepaymentBulkArchiveConflictError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    }
    if (error instanceof Error) {
      if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
        return NextResponse.json({ ok: false, error: "Sign in to manage repayment history." }, { status: 401 });
      }
      if (error.name === "OwnershipError") {
        return NextResponse.json({ ok: false, error: "One or more selected repayments are not available for your account." }, { status: 404 });
      }
    }
    return NextResponse.json({ ok: false, error: "We could not update those repayments safely." }, { status: 400 });
  }
}
