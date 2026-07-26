import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { listTransactionActivityHistory } from "@/src/server/activity-history";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ transactionId: string }>;
};

function safeError(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return "Sign in to view transaction activity.";
    }
    if (error.name === "OwnershipError") {
      return "That transaction could not be found for your account.";
    }
  }
  return "Transaction activity could not be loaded safely.";
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const activity = await listTransactionActivityHistory(context, (await params).transactionId);
    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}
