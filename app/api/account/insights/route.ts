import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { getEverydayInsights } from "@/src/server/everyday-insights";

export const dynamic = "force-dynamic";

function safeInsightError(error: unknown) {
  if (error instanceof Error && (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError")) {
    return "Sign in to view everyday insights.";
  }
  return "Everyday insights could not be loaded safely. Refresh and try again.";
}

export async function GET() {
  try {
    const context = await getCurrentUserContext();
    const insights = await getEverydayInsights(context);
    return NextResponse.json({ ok: true, insights });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeInsightError(error) }, { status: 401 });
  }
}
