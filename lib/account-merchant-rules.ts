import type {
  LocalMerchantData,
  MerchantConflict,
  MerchantConflictResolution,
} from "@/lib/merchant-rules";

type AccountMerchantResponse =
  | { ok: true; data: LocalMerchantData; importedCount?: number; skippedCount?: number }
  | { ok: false; error: string; conflict?: MerchantConflict };

async function readResponse(response: Response): Promise<AccountMerchantResponse> {
  try {
    const payload = await response.json() as AccountMerchantResponse;
    return payload.ok ? payload : {
      ok: false,
      error: payload.error || "We could not update your account merchant suggestions.",
      conflict: payload.conflict,
    };
  } catch {
    return { ok: false, error: "We could not read the account merchant response safely." };
  }
}

async function jsonRequest(url: string, method: string, body?: unknown) {
  return readResponse(await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  }));
}

export function listAccountMerchantData() {
  return jsonRequest("/api/account/merchant-rules", "GET");
}

export function replaceAccountMerchantData(data: LocalMerchantData) {
  return jsonRequest("/api/account/merchant-rules", "PUT", { data });
}

export function saveAccountMerchantRule(input: {
  merchantName: string;
  categoryId: string;
  resolution?: MerchantConflictResolution;
}) {
  return jsonRequest("/api/account/merchant-rules", "POST", { kind: "RULE", ...input });
}

export function saveAccountMerchantAlias(input: {
  alias: string;
  canonicalName: string;
  categoryId: string;
  resolution?: MerchantConflictResolution;
}) {
  return jsonRequest("/api/account/merchant-rules", "POST", { kind: "ALIAS", ...input });
}

export function renameAccountMerchantProfile(profileId: string, name: string) {
  return jsonRequest(`/api/account/merchant-rules/profiles/${encodeURIComponent(profileId)}`, "PATCH", { name });
}

export function updateAccountMerchantAlias(aliasId: string, input: {
  name?: string;
  isActive?: boolean;
  resolution?: MerchantConflictResolution;
}) {
  return jsonRequest(`/api/account/merchant-rules/aliases/${encodeURIComponent(aliasId)}`, "PATCH", input);
}

export function deleteAccountMerchantAlias(aliasId: string) {
  return jsonRequest(`/api/account/merchant-rules/aliases/${encodeURIComponent(aliasId)}`, "DELETE");
}

export function updateAccountMerchantRule(ruleId: string, input: { isActive: boolean }) {
  return jsonRequest(`/api/account/merchant-rules/rules/${encodeURIComponent(ruleId)}`, "PATCH", input);
}

export function deleteAccountMerchantRule(ruleId: string) {
  return jsonRequest(`/api/account/merchant-rules/rules/${encodeURIComponent(ruleId)}`, "DELETE");
}

export function clearAccountMerchantData() {
  return jsonRequest("/api/account/merchant-rules", "DELETE");
}

export function migrateAccountMerchantData(data: LocalMerchantData) {
  return jsonRequest("/api/account/merchant-rules/migrate", "POST", { data });
}
