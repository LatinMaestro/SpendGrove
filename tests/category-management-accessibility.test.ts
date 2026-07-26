import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const controlsPath = new URL("../components/custom-category-controls.tsx", import.meta.url);
const administrationPath = new URL("../components/account-data-management.tsx", import.meta.url);
const importReviewPath = new URL("../components/import-review-foundation.tsx", import.meta.url);

async function sources() {
  const [controls, administration, importReview] = await Promise.all([
    readFile(controlsPath, "utf8"),
    readFile(administrationPath, "utf8"),
    readFile(importReviewPath, "utf8"),
  ]);
  const manager = controls.slice(controls.indexOf("export function CustomCategoryManager"));
  return { controls, administration, importReview, manager };
}

describe("Phase C3 Category management reliability and accessibility", () => {
  it("uses the parent catalogue as the authoritative account-state source", async () => {
    const { controls, administration, manager } = await sources();

    expect(controls).toContain('export type CategoryStorageMode = "loading" | "account" | "unavailable"');
    expect(administration).toContain("storageMode={categories.storageMode}");
    expect(administration).toContain("pendingOperation={categories.pendingOperation}");
    expect(administration).toContain("error={categories.error}");
    expect(administration).toContain("onClearMessages={categories.clearMessages}");
    expect(manager).not.toContain("listAccountCustomCategories");
  });

  it("prevents overlapping optimistic Category writes and preserves rollback", async () => {
    const { controls } = await sources();

    expect(controls).toContain("const pendingRef = useRef<PendingCategoryOperation>(null)");
    expect(controls).toContain("if (pendingRef.current)");
    expect(controls).toContain("Another Category change is still saving");
    expect(controls).toContain("setPendingOperation(operation)");
    expect(controls).toContain("setCatalogue(previous)");
    expect(controls).toContain(".finally(endOperation)");
    expect(controls).toContain("finally {\n      endOperation();\n    }");
  });

  it("separates loading, polite status and actionable error states", async () => {
    const { controls, manager } = await sources();

    expect(controls).toContain('useState("Loading account categories…")');
    expect(manager).toContain('aria-busy={effectiveStorageMode === "loading" || operationPending}');
    expect(manager).toContain('role="status" aria-live="polite"');
    expect(manager).toContain('role="alert"');
    expect(manager.indexOf('effectiveStorageMode === "loading"')).toBeLessThan(manager.indexOf("No saved Categories yet."));
    expect(manager).not.toContain("Browser storage is unavailable");
    expect(manager).not.toContain("Unreadable saved categories");
    expect(manager).not.toContain("newer app version");
  });

  it("adds Category-specific rename, Cancel and focus restoration", async () => {
    const { manager } = await sources();

    expect(manager).toContain("renameButtonRefs");
    expect(manager).toContain("renameInputRef");
    expect(manager).toContain("function cancelRename()");
    expect(manager).toContain('aria-label={`New name for ${category.name}`}');
    expect(manager).toContain("returnFocus(renameButtonRefs.current, categoryId)");
    expect(manager).toContain('disabled={renamePending} onClick={cancelRename}');
    expect(manager).toContain("await onRename(categoryId, editingName)");
  });

  it("makes archive reversible and explicit without adding hard deletion", async () => {
    const { manager } = await sources();

    expect(manager).toContain("Archiving removes a Category from new choices.");
    expect(manager).toContain("Existing Transactions keep the Category and their totals do not change.");
    expect(manager).toContain("Archive Category");
    expect(manager).toContain("Keep available");
    expect(manager).toContain("Existing Transactions and totals will not change");
    expect(manager).toContain("Restore");
    expect(manager).not.toMatch(/Delete Category|Trash2|hard delete/i);
  });

  it("shows separate available and archived custom Category counts", async () => {
    const { manager } = await sources();

    expect(manager).toContain("const availableCategories = categories.filter");
    expect(manager).toContain("const archivedCategories = categories.filter");
    expect(manager).toContain("{availableCategories.length} available");
    expect(manager).toContain("{archivedCategories.length} archived");
  });

  it("keeps controls usable at 390 px with visible keyboard focus", async () => {
    const { manager } = await sources();

    expect(manager).toContain("break-words");
    expect(manager).toContain("min-[390px]:flex-row");
    expect(manager).toContain("flex-col gap-2 sm:flex-row");
    expect(manager.match(/focus-visible:ring-2/g)?.length ?? 0).toBeGreaterThanOrEqual(8);
    expect(manager).toContain("min-h-11");
  });

  it("preserves Import Review catalogue reuse and financial boundaries", async () => {
    const { controls, importReview } = await sources();

    expect(importReview).toContain("const customCategoryCatalogue = useCustomCategoryCatalogue()");
    expect(importReview).toContain("onCreateCategory={customCategoryCatalogue.create}");
    expect(importReview).toContain("<CustomCategoryManager");
    expect(controls).toContain("createCustomCategory(categories");
    expect(controls).toContain("renameCustomCategory(categories");
    expect(controls).toContain("setCustomCategoryArchived(categories");
    expect(controls).not.toMatch(/amountCents\s*=|transaction\.categoryId\s*=|updateMany|deleteAccountCustomCategory/);
  });
});
