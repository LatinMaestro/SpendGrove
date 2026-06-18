import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { SavedImportProfile } from "@/lib/saved-import-profiles";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { migrateDurableSavedImportProfiles } from "@/src/server/saved-import-profiles";

export const dynamic = "force-dynamic";

function safeError(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Check the saved mappings and try again.";
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") return "Sign in before moving saved mappings to your account.";
    if (error.message === "Saved mappings selected for migration must be unique.") return error.message;
  }
  return "We could not move those mappings safely. Your device copy was not changed.";
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const payload = await request.json() as { profiles?: SavedImportProfile[] };
    if (!Array.isArray(payload.profiles)) throw new Error("Choose valid saved mappings before moving them to your account.");
    const result = await migrateDurableSavedImportProfiles(context, payload.profiles);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}
