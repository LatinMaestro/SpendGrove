import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { loanRepaymentCommitRequestSchema } from "@/lib/loan-repayment-commit";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { listSafeLoanRepayments } from "@/src/server/loan-repayment-history";
import {
  LoanRepaymentCommitConflictError,
  commitReviewedLoanRepayments,
  listSafeLoanImportHistory,
} from "@/src/server/loan-repayments";

export const dynamic = "force-dynamic";

function safeError(error: unknown) {
  if (error instanceof ZodError) return { status: 400, message: error.issues[0]?.message ?? "Check the reviewed repayments and try again." };
  if (error instanceof LoanRepaymentCommitConflictError) return { status: 409, message: error.message };
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return { status: 401, message: "Sign in to save reviewed loan repayments." };
    }
    if (error.name === "OwnershipError") return { status: 404, message: "That active Loan Account is not available for your account." };
  }
  return { status: 400, message: "We could not save these reviewed repayments safely. Nothing was partly saved." };
}

export async function GET() {
  try {
    const context = await getCurrentUserContext();
    const [imports, repayments] = await Promise.all([
      listSafeLoanImportHistory(context),
      listSafeLoanRepayments(context),
    ]);
    return NextResponse.json({ ok: true, imports, repayments });
  } catch (error) {
    const safe = safeError(error);
    return NextResponse.json({ ok: false, imports: [], error: safe.message }, { status: safe.status });
  }
}

export async function POST(request: Request) {
  try {
    const payload = loanRepaymentCommitRequestSchema.parse(await request.json());
    const summary = await commitReviewedLoanRepayments(await getCurrentUserContext(), payload);
    return NextResponse.json({ ok: true, summary }, { status: summary.alreadyCommitted ? 200 : 201 });
  } catch (error) {
    const safe = safeError(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
