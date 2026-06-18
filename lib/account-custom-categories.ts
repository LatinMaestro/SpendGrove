import type { CustomCategory } from "@/lib/custom-categories";
import type { ManualCategoryType } from "@/lib/manual-categories";

export type AccountCategoryInput = {
  id?: string;
  name: string;
  group: CustomCategory["group"];
  type?: ManualCategoryType;
  isArchived?: boolean;
};

type AccountCategoryResponse =
  | { ok: true; categories: CustomCategory[]; category?: CustomCategory; importedCount?: number; skippedCount?: number }
  | { ok: false; error: string };

async function readResponse(response: Response): Promise<AccountCategoryResponse> {
  try {
    const payload = await response.json() as AccountCategoryResponse;
    if (payload.ok) return payload;
    return { ok: false, error: payload.error || "We could not update your account categories." };
  } catch {
    return { ok: false, error: "We could not read the account category response safely." };
  }
}

export async function listAccountCustomCategories() {
  return readResponse(await fetch("/api/account/categories", {
    method: "GET",
    cache: "no-store",
  }));
}

export async function createAccountCustomCategory(input: AccountCategoryInput) {
  return readResponse(await fetch("/api/account/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }));
}

export async function updateAccountCustomCategory(
  categoryId: string,
  input: { name?: string; isArchived?: boolean },
) {
  return readResponse(await fetch(`/api/account/categories/${encodeURIComponent(categoryId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }));
}

export async function migrateAccountCustomCategories(categories: CustomCategory[]) {
  return readResponse(await fetch("/api/account/categories/migrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categories }),
  }));
}
