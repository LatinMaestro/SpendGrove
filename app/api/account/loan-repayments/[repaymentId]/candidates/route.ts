import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { listLoanReconciliationCandidates } from "@/src/server/loan-reconciliation";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { repaymentId: string } }) {
  try {
    const mode = new URL(request.url).searchParams.get("mode") === "manual" ? "MANUAL" : "SUGGESTED";
    const candidates = await listLoanReconciliationCandidates(await getCurrentUserContext(), params.repaymentId, mode);
    return NextResponse.json({ ok: true, mode, candidates });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
        return NextResponse.json({ ok: false, candidates: [], error: "Sign in to review possible matches." }, { status: 401 });
      }
      if (error.name === "OwnershipError") {
        return NextResponse.json({ ok: false, candidates: [], error: "That repayment is not available for your account." }, { status: 404 });
      }
    }
    return NextResponse.json({ ok: false, candidates: [], error: "Possible matches are unavailable right now." }, { status: 400 });
  }
}
