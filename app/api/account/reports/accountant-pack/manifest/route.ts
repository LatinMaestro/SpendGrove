import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  accountantPackManifestFileName,
  createAccountantPackManifest,
} from "@/src/server/accountant-pack";
import { getCurrentUserContext } from "@/src/server/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const endingYear = new URL(request.url).searchParams.get("financialYear");
    const manifest = await createAccountantPackManifest(await getCurrentUserContext(), endingYear);
    return new NextResponse(JSON.stringify(manifest, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${accountantPackManifestFileName(manifest)}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof ZodError
      ? "Choose a valid financial year before preparing the pack."
      : error instanceof Error && (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError")
        ? "Sign in to prepare accountant files."
        : "The preparation-pack manifest could not be created safely.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
