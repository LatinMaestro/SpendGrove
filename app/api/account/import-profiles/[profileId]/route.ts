import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  deleteDurableSavedImportProfile,
  listDurableSavedImportProfiles,
  updateDurableSavedImportProfile,
} from "@/src/server/saved-import-profiles";

export const dynamic = "force-dynamic";

type RouteContext = { params: { profileId: string } };

const safeMessages = new Set([
  "A saved mapping with this name already exists.",
  "Choose a saved mapping change before saving.",
]);

function safeError(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Check the saved mapping details and try again.";
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") return "Sign in to update account mappings.";
    if (error.name === "OwnershipError") return "That saved mapping could not be found for your account.";
    if (safeMessages.has(error.message)) return error.message;
  }
  return "We could not update that saved mapping safely.";
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const profile = await updateDurableSavedImportProfile(
      context,
      params.profileId,
      await request.json() as { displayName?: string; isEnabled?: boolean; markUsed?: boolean },
    );
    return NextResponse.json({ ok: true, profile, profiles: await listDurableSavedImportProfiles(context) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    await deleteDurableSavedImportProfile(context, params.profileId);
    return NextResponse.json({ ok: true, profiles: await listDurableSavedImportProfiles(context) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}
