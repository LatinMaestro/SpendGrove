import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const categoryServerPath = new URL("../src/server/custom-categories.ts", import.meta.url);
const merchantServerPath = new URL("../src/server/merchant-rules.ts", import.meta.url);
const categoryControlsPath = new URL("../components/custom-category-controls.tsx", import.meta.url);
const merchantManagerPath = new URL("../components/merchant-rule-manager.tsx", import.meta.url);
const importReviewPath = new URL("../components/import-review-foundation.tsx", import.meta.url);
const accountAdministrationPath = new URL("../components/account-data-management.tsx", import.meta.url);
const categoryBehaviourPath = new URL("./server/durable-custom-categories.test.ts", import.meta.url);
const merchantBehaviourPath = new URL("./server/durable-merchant-rules.test.ts", import.meta.url);

async function readSources() {
  const [
    categoryServer,
    merchantServer,
    categoryControls,
    merchantManager,
    importReview,
    accountAdministration,
    categoryBehaviour,
    merchantBehaviour,
  ] = await Promise.all([
    readFile(categoryServerPath, "utf8"),
    readFile(merchantServerPath, "utf8"),
    readFile(categoryControlsPath, "utf8"),
    readFile(merchantManagerPath, "utf8"),
    readFile(importReviewPath, "utf8"),
    readFile(accountAdministrationPath, "utf8"),
    readFile(categoryBehaviourPath, "utf8"),
    readFile(merchantBehaviourPath, "utf8"),
  ]);

  return {
    categoryServer,
    merchantServer,
    categoryControls,
    merchantManager,
    importReview,
    accountAdministration,
    categoryBehaviour,
    merchantBehaviour,
  };
}

describe("Phase C3 merchant and Category regression package", () => {
  it("keeps durable custom Categories authenticated, owner-scoped and recoverable", async () => {
    const { categoryServer } = await readSources();

    expect(categoryServer).toContain("requireAuthenticatedUserContext(context)");
    expect(categoryServer).toContain('assertUserOwnsRecord(user, existing, "category")');
    expect(categoryServer).toContain("where: {\n          userId,");
    expect(categoryServer).toContain("isSeeded: false");
    expect(categoryServer).toContain("deletedAt: null");
    expect(categoryServer).toContain("isArchived?: boolean");
    expect(categoryServer).not.toMatch(/deleteMany|deleteDurableCustomCategory|hard delete/i);
  });

  it("keeps durable merchant data account-scoped with bounded rule types and owned Categories", async () => {
    const { merchantServer } = await readSources();

    expect(merchantServer).toContain("requireAuthenticatedUserContext");
    expect(merchantServer).toContain('const supportedRuleTypes = ["EXACT", "CONTAINS", "STARTS_WITH"] as const');
    expect(merchantServer).toContain("where: { userId, deletedAt: null }");
    expect(merchantServer).toContain("where: { id: categoryId, userId, deletedAt: null }");
    expect(merchantServer).toContain("serializeMerchantRuleStorage(data)");
    expect(merchantServer).not.toMatch(/rawRow|fileName|accountNumber|cardFragment|customerId|balanceCents/i);
  });

  it("retains behavioural coverage for lifecycle, isolation, conflicts and private-field rejection", async () => {
    const { categoryBehaviour, merchantBehaviour } = await readSources();

    expect(categoryBehaviour).toContain("creates, lists, renames, archives and restores user-owned categories");
    expect(categoryBehaviour).toContain("keeps seeded categories immutable and blocks cross-user access");
    expect(categoryBehaviour).toContain("requires authenticated user context before any category store access");
    expect(categoryBehaviour).toContain("rejects private banking identifiers before durable storage");

    expect(merchantBehaviour).toContain("requires explicit conflict choices and preserves keep-existing behavior");
    expect(merchantBehaviour).toContain("supports rename, disable, restore and soft-delete style lifecycle snapshots");
    expect(merchantBehaviour).toContain("blocks cross-user entity access and requires auth before store access");
    expect(merchantBehaviour).toContain("rejects private identifiers and raw narration before durable writes");
  });

  it("keeps Category administration serialized, reversible and accessible", async () => {
    const { categoryControls, accountAdministration } = await readSources();

    expect(categoryControls).toContain("const pendingRef = useRef<PendingCategoryOperation>(null)");
    expect(categoryControls).toContain("Another Category change is still saving");
    expect(categoryControls).toContain("setCatalogue(previous)");
    expect(categoryControls).toContain("function cancelRename()");
    expect(categoryControls).toContain("returnFocus(renameButtonRefs.current, categoryId)");
    expect(categoryControls).toContain("Existing Transactions keep the Category and their totals do not change.");
    expect(categoryControls).toContain("Archive Category");
    expect(categoryControls).toContain("Restore");
    expect(categoryControls).not.toMatch(/Delete Category|deleteAccountCustomCategory|Trash2/i);

    expect(accountAdministration).toContain("const categories = useCustomCategoryCatalogue()");
    expect(accountAdministration).toContain("storageMode={categories.storageMode}");
    expect(accountAdministration).toContain("pendingOperation={categories.pendingOperation}");
    expect(accountAdministration).toContain("onRename={categories.rename}");
    expect(accountAdministration).toContain("onArchiveChange={categories.setArchived}");
  });

  it("keeps merchant suggestions deterministic, future-review-only and explicitly correctable", async () => {
    const { merchantManager } = await readSources();

    expect(merchantManager).toContain('EXACT: "Exact merchant match"');
    expect(merchantManager).toContain('STARTS_WITH: "Name starts with"');
    expect(merchantManager).toContain('CONTAINS: "Name contains"');
    expect(merchantManager).toContain("Saved suggestions come from choices you reviewed.");
    expect(merchantManager).toContain("they do not silently edit existing transactions.");
    expect(merchantManager).toContain("Existing transactions and Categories will not be changed.");
    expect(merchantManager).toContain("Use new merchant for this match");
    expect(merchantManager).toContain("Keep current merchant");
    expect(merchantManager).toContain("cancelAliasEdit");
    expect(merchantManager).not.toContain("rule.normalizedPattern");
  });

  it("keeps Import Review as the shared reviewed integration without direct financial mutation", async () => {
    const { importReview } = await readSources();

    expect(importReview).toContain("const customCategoryCatalogue = useCustomCategoryCatalogue()");
    expect(importReview).toContain("onCreateCategory={customCategoryCatalogue.create}");
    expect(importReview).toContain("<CustomCategoryManager");
    expect(importReview).toContain("<MerchantRuleManager");
    expect(importReview).toContain("Import, Skip or Merge");
    expect(importReview).toContain("Nothing creates transactions until you explicitly confirm.");
    expect(importReview).toContain("<ImportCommitPanel rows={rows}");
    expect(importReview).not.toMatch(/transaction\.update|amountCents\s*=|prisma\.|raw CSV.*saved/i);
  });

  it("keeps this completion slice inside existing schema, privacy and financial boundaries", async () => {
    const {
      categoryServer,
      merchantServer,
      categoryControls,
      merchantManager,
      importReview,
      accountAdministration,
    } = await readSources();
    const combined = [
      categoryServer,
      merchantServer,
      categoryControls,
      merchantManager,
      importReview,
      accountAdministration,
    ].join("\n");

    expect(combined).not.toMatch(/MerchantMergeOperation|MerchantMergeTransactionItem/);
    expect(combined).not.toMatch(/Basiq|OpenAI|Anthropic|Stripe|StoreKit/);
    expect(combined).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
    expect(combined).not.toMatch(/tax deductible|automatically deductible|financial advice/i);
    expect(categoryControls).toContain("focus-visible:ring-2");
    expect(merchantManager).toContain("focus-visible:ring-2 focus-visible:ring-focus");
  });
});
