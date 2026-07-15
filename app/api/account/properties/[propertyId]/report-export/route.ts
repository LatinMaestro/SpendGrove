import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { getPropertyRecordCsv } from "@/src/server/property-report-output";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ propertyId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const endingYear = new URL(request.url).searchParams.get("financialYear");
    const result = await getPropertyRecordCsv(context, (await params).propertyId, endingYear);
    return new NextResponse(result.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="spendgrove-property-records-${result.financialYearLabel}.csv"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof ZodError
      ? "Choose a valid financial year before exporting."
      : error instanceof Error && (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError")
        ? "Sign in to export Property records."
        : "That Property export is not available for your account.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
