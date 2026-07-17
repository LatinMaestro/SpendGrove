import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const settingsPage = readFileSync("app/settings/page.tsx", "utf8");
const administration = readFileSync("components/account-data-management.tsx", "utf8");
const merchantManager = readFileSync("components/merchant-rule-manager.tsx", "utf8");
const categoryControls = readFileSync("components/custom-category-controls.tsx", "utf8");

describe("Phase 6 account data administration", () => {
  it("keeps category, merchant and saved-mapping management secondary but reachable", () => {
    expect(settingsPage).toContain("<AccountDataManagement />");
    expect(administration).toContain("Manage categories, merchants and mappings");
    expect(administration).toContain("<CustomCategoryManager");
    expect(administration).toContain("<MerchantRuleManager");
    expect(administration).toContain("<SavedMappingAdministration />");
  });

  it("preserves account ownership APIs and private import boundaries", () => {
    expect(administration).toContain("listAccountSavedImportProfiles");
    expect(merchantManager).toContain("listAccountMerchantData");
    expect(categoryControls).toContain("listAccountCustomCategories");
    expect(administration).toContain("No CSV content or filenames are stored here.");
    expect(administration).not.toMatch(/rawRow|accountNumber|\bBSB\b|cardReference/);
  });

  it("keeps management actions plain, recoverable and out of primary navigation", () => {
    expect(administration).toContain("Rename");
    expect(administration).toContain("Disable");
    expect(administration).toContain("Restore");
    expect(administration).toContain("Delete");
    expect(settingsPage).not.toContain("BottomNav");
    expect(settingsPage).not.toContain('href="/merchants"');
    expect(settingsPage).not.toContain('href="/categories"');
  });
});
