import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  createLoanFinancialYearCsv,
  getLoanFinancialYearReport,
} from "@/src/server/loan-reporting";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const endingYear = new URL(request.url).searchParams.get("financialYear");
    const report = await getLoanFinancialYearReport(await getCurrentUserContext(), endingYear);
    const csv = createLoanFinancialYearCsv(report);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="spendgrove-loan-report-${report.financialYear.label}.csv"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof ZodError
      ? "Choose a valid financial year before exporting."
      : error instanceof Error && (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError")
        ? "Sign in to export Loan records."
        : "The Loan report could not be exported safely.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
