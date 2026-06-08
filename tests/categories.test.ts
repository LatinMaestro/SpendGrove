import { describe, expect, it } from "vitest";
import { assertValidCategoryParent, categoryCreateSchema } from "@/lib/validation/categories";

describe("category validation", () => {
  it("validates a user-owned category", () => {
    const category = categoryCreateSchema.parse({
      userId: "user_1",
      name: "Groceries",
      type: "EXPENSE",
    });

    expect(category.userId).toBe("user_1");
    expect(category.isArchived).toBe(false);
  });

  it("prevents a category from parenting itself", () => {
    expect(() => assertValidCategoryParent("cat_1", "cat_1")).toThrow();
  });
});
