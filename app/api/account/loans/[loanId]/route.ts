import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { updateLoanAccount, type LoanAccountUpdateInput } from "@/src/server/loan-metadata";

export const dynamic = "force-dynamic";

function safeError(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Check the loan details and try again.";
  if (error instanceof Error) {
    if (error.name === "OwnershipError") return "That loan could not be found for your account.";
    if (/private bank identifier/i.test(error.message) || error.message === "Choose an active property.") return error.message;
  }
  return "We could not update that loan safely. Please try again.";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ loanId: string }> }) {
  try {
    const context = await getCurrentUserContext();
    const input = await request.json() as LoanAccountUpdateInput;
    return NextResponse.json({ ok: true, ...(await updateLoanAccount(context, (await params).loanId, input)) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}
