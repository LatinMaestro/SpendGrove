import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { SavedImportProfile } from "@/lib/saved-import-profiles";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  createDurableSavedImportProfile,
  listDurableSavedImportProfiles,
  resetDurableSavedImportProfiles,
} from "@/src/server/saved-import-profiles";

export const dynamic = "force-dynamic";

const safeMessages = new Set([
  "A saved mapping with this name already exists.",
]);

function safeError(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Check the saved mapping details and try again.";
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") return "Sign in to save mappings to your account.";
    if (safeMessages.has(error.message)) return error.message;
  }
  return "We could not save that mapping safely. Please try again.";
}

export async function GET() {
  try {
    const context = await getCurrentUserContext();
    return NextResponse.json({ ok: true, profiles: await listDurableSavedImportProfiles(context) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const profile = await createDurableSavedImportProfile(context, await request.json() as SavedImportProfile);
    return NextResponse.json({ ok: true, profile, profiles: await listDurableSavedImportProfiles(context) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    const context = await getCurrentUserContext();
    const deletedCount = await resetDurableSavedImportProfiles(context);
    return NextResponse.json({ ok: true, profiles: [], deletedCount });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}
