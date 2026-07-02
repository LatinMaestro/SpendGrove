import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { getPropertyActivity } from "@/src/server/property-activity";

export const dynamic = "force-dynamic";

type RouteContext = { params: { propertyId: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const activity = await getPropertyActivity(context, params.propertyId);
    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    const message = error instanceof Error && (
      error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError"
    )
      ? "Sign in to review Property record keeping."
      : "That Property activity is not available for your account.";
    return NextResponse.json({ ok: false, error: message }, { status: 404 });
  }
}
