import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { loanRepaymentDuplicateCheckRequestSchema } from "@/lib/loan-repayment-commit";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { assessReviewedLoanRepaymentDuplicates } from "@/src/server/loan-repayments";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = loanRepaymentDuplicateCheckRequestSchema.parse(await request.json());
    const signals = await assessReviewedLoanRepaymentDuplicates(await getCurrentUserContext(), payload);
    return NextResponse.json({ ok: true, signals });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, signals: [], error: error.issues[0]?.message ?? "Check the reviewed repayments." }, { status: 400 });
    }
    if (error instanceof Error) {
      if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
        return NextResponse.json({ ok: false, signals: [], error: "Sign in to check reviewed loan repayments." }, { status: 401 });
      }
      if (error.name === "OwnershipError") {
        return NextResponse.json({ ok: false, signals: [], error: "That active Loan Account is not available for your account." }, { status: 404 });
      }
    }
    return NextResponse.json({ ok: false, signals: [], error: "We could not check these repayments safely. Retry before saving." }, { status: 400 });
  }
}
