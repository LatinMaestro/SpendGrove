import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const managerPath = new URL("../components/merchant-rule-manager.tsx", import.meta.url);
const accountPath = new URL("../components/account-data-management.tsx", import.meta.url);
const routePath = new URL("../app/api/account/merchant-rules/profiles/[profileId]/route.ts", import.meta.url);
const serverPath = new URL("../src/server/merchant-rules.ts", import.meta.url);

describe("Phase 7 merchant profile completion", () => {
  it("keeps profile editing and reversible lifecycle controls in secondary account management", async () => {
    const manager = await readFile(managerPath, "utf8");

    for (const copy of [
      "Edit merchant",
      "Merchant name",
      "Suggested category",
      "Save changes",
      "Remove merchant",
      "Removed merchants",
      "Restore merchant",
      "Not used for new suggestions",
    ]) {
      expect(manager).toContain(copy);
    }
    expect(manager).toContain("activeProfiles.map");
    expect(manager).toContain("removedProfiles.map");
    expect(manager).not.toMatch(/merge merchant|apply to all history|recategorise history/i);
  });

  it("reuses the active seeded and owned category catalogue without exposing internal keys", async () => {
    const [account, manager] = await Promise.all([
      readFile(accountPath, "utf8"),
      readFile(managerPath, "utf8"),
    ]);

    expect(account).toContain("...manualCategories");
    expect(account).toContain("!category.isArchived");
    expect(account).toContain("categoryOptions={categoryOptions}");
    expect(manager).toContain("category.group");
    expect(manager).not.toContain("normalizedName");
    expect(manager).not.toContain("normalizedPattern");
  });

  it("keeps profile mutations authenticated, owner-scoped and category-validated", async () => {
    const [route, server] = await Promise.all([
      readFile(routePath, "utf8"),
      readFile(serverPath, "utf8"),
    ]);

    expect(route).toContain("getCurrentUserContext");
    expect(route).toContain("updateDurableMerchantProfile");
    expect(route).toContain('["name", "categoryId", "isActive"]');
    expect(server).toContain("requireProfile(data, profileId)");
    expect(server).toContain("store.categoryAvailable");
    expect(server).toContain('OwnershipError("available category")');
    expect(route).not.toMatch(/console\.|DATABASE_URL|DIRECT_DATABASE_URL/);
  });
});
