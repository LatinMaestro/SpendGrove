import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  applyPropertyRecordSuggestions,
  classifyPropertyRecord,
  getPropertyRecordReview,
} from "@/src/server/property-report-review";
import { summarizePropertyRecords } from "@/src/server/property-report-output";

export const dynamic = "force-dynamic";

type RouteContext = { params: { propertyId: string } };

function safeError(error: unknown) {
  if (error instanceof ZodError) return "Choose a valid financial year and record classification.";
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return "Sign in to review Property records.";
    }
    if (error.name === "OwnershipError") return "That Property record is not available for your account.";
    if (error.name === "PropertyRecordReviewConflictError" || error.name === "PropertyRecordClassificationError") {
      return error.message;
    }
  }
  return "The Property record review could not be updated safely.";
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const endingYear = new URL(request.url).searchParams.get("financialYear");
    const review = await getPropertyRecordReview(context, params.propertyId, endingYear);
    return NextResponse.json({ ok: true, review, summary: summarizePropertyRecords(review) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const result = await classifyPropertyRecord(context, params.propertyId, await request.json());
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const result = await applyPropertyRecordSuggestions(context, params.propertyId, await request.json());
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}
