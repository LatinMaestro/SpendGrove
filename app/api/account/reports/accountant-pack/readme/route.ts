import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  accountantPackReadme,
  createAccountantPackManifest,
} from "@/src/server/accountant-pack";
import { getCurrentUserContext } from "@/src/server/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const endingYear = new URL(request.url).searchParams.get("financialYear");
    const manifest = await createAccountantPackManifest(await getCurrentUserContext(), endingYear);
    return new NextResponse(accountantPackReadme(manifest), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="spendgrove-accountant-pack-${manifest.financialYear.label}-readme.txt"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof ZodError
      ? "Choose a valid financial year before preparing the pack."
      : error instanceof Error && (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError")
        ? "Sign in to prepare accountant files."
        : "The preparation-pack read me could not be created safely.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
