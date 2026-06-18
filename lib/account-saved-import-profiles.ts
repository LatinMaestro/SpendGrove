import type { SavedImportProfile } from "@/lib/saved-import-profiles";

type AccountProfileResponse =
  | { ok: true; profiles: SavedImportProfile[]; profile?: SavedImportProfile; importedCount?: number; skippedCount?: number }
  | { ok: false; error: string };

async function readResponse(response: Response): Promise<AccountProfileResponse> {
  try {
    const payload = await response.json() as AccountProfileResponse;
    return payload.ok ? payload : { ok: false, error: payload.error || "We could not update your account mappings." };
  } catch {
    return { ok: false, error: "We could not read the account mapping response safely." };
  }
}

export async function listAccountSavedImportProfiles() {
  return readResponse(await fetch("/api/account/import-profiles", { method: "GET", cache: "no-store" }));
}

export async function createAccountSavedImportProfile(profile: SavedImportProfile) {
  return readResponse(await fetch("/api/account/import-profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  }));
}

export async function updateAccountSavedImportProfile(profileId: string, input: { displayName?: string; isEnabled?: boolean; markUsed?: boolean }) {
  return readResponse(await fetch(`/api/account/import-profiles/${encodeURIComponent(profileId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }));
}

export async function deleteAccountSavedImportProfile(profileId: string) {
  return readResponse(await fetch(`/api/account/import-profiles/${encodeURIComponent(profileId)}`, { method: "DELETE" }));
}

export async function resetAccountSavedImportProfiles() {
  return readResponse(await fetch("/api/account/import-profiles", { method: "DELETE" }));
}

export async function migrateAccountSavedImportProfiles(profiles: SavedImportProfile[]) {
  return readResponse(await fetch("/api/account/import-profiles/migrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profiles }),
  }));
}
