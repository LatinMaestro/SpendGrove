import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { listRecentActivityHistory } from "@/src/server/activity-history";

export const dynamic = "force-dynamic";

function safeError(error: unknown) {
  if (error instanceof Error && (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError")) {
    return "Sign in to view account activity.";
  }
  return "Activity history could not be loaded safely.";
}

export async function GET() {
  try {
    const context = await getCurrentUserContext();
    const activity = await listRecentActivityHistory(context);
    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}
