import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { listSafeImportHistory } from "@/src/server/import-history";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entries = await listSafeImportHistory(await getCurrentUserContext());
    return NextResponse.json({ entries });
  } catch (error) {
    if (error instanceof Error
      && (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError")) {
      return NextResponse.json(
        { entries: [], error: "Sign in to view durable import history for your SpendGrove account." },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { entries: [], error: "Account import history is unavailable right now. Browser-local review summaries are unaffected." },
      { status: 503 },
    );
  }
}
