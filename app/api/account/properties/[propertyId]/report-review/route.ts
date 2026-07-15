import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { getPropertyRecordReview } from "@/src/server/property-report-review";
import { summarizePropertyRecords } from "@/src/server/property-report-output";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ propertyId: string }> };

function safeError(error: unknown) {
  if (error instanceof ZodError) return "Choose a valid financial year.";
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return "Sign in to review Property records.";
    }
    if (error.name === "OwnershipError") return "That Property record is not available for your account.";
  }
  return "The Property records could not be loaded safely.";
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const endingYear = new URL(request.url).searchParams.get("financialYear");
    const review = await getPropertyRecordReview(context, (await params).propertyId, endingYear);
    return NextResponse.json({ ok: true, review, summary: summarizePropertyRecords(review) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}
