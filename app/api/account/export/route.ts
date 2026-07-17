import { auth, reverificationErrorResponse } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { accountExportFileName, createAccountExport } from "@/src/server/account-export";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const { has } = await auth();
    if (!has({ reverification: "strict" })) {
      return reverificationErrorResponse("strict");
    }

    const context = await getCurrentUserContext();
    const now = new Date();
    const exportDocument = await createAccountExport(context, undefined, now);

    return new NextResponse(JSON.stringify(exportDocument, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${accountExportFileName(now)}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const authenticationError = error instanceof Error
      && (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError");
    return NextResponse.json(
      {
        ok: false,
        error: authenticationError
          ? "Sign in again to export your account data."
          : "Your account export could not be prepared safely. Please try again.",
      },
      {
        status: authenticationError ? 401 : 500,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  }
}
