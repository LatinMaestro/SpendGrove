import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { listLoanReconciliationCandidates } from "@/src/server/loan-reconciliation";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { repaymentId: string } }) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const requestedMode = searchParams.get("mode");
    const mode = requestedMode === "override" ? "OVERRIDE" : requestedMode === "manual" ? "MANUAL" : "SUGGESTED";
    const overrideDate = searchParams.get("date") ?? undefined;
    if (mode === "OVERRIDE" && !/^\d{4}-\d{2}-\d{2}$/.test(overrideDate ?? "")) {
      return NextResponse.json({ ok: false, candidates: [], error: "Choose an exact transaction date for manual override search." }, { status: 400 });
    }
    const candidates = await listLoanReconciliationCandidates(await getCurrentUserContext(), params.repaymentId, mode, undefined, overrideDate);
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
