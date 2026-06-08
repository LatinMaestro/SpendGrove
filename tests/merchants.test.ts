import { describe, expect, it } from "vitest";
import { merchantRuleCreateSchema } from "@/lib/validation/merchants";

describe("merchant validation", () => {
  it("validates local-first merchant rules", () => {
    const rule = merchantRuleCreateSchema.parse({
      userId: "user_1",
      type: "CONTAINS",
      pattern: "Woolworths",
      normalizedPattern: "Woolworths",
      categoryId: "cat_1",
    });

    expect(rule.normalizedPattern).toBe("woolworths");
    expect(rule.isActive).toBe(true);
  });

  it("redacts private card fragments before storing merchant patterns", () => {
    const rule = merchantRuleCreateSchema.parse({
      userId: "user_1",
      type: "CONTAINS",
      pattern: "WOOLWORTHS CARD XX1234",
      normalizedPattern: "WOOLWORTHS CARD XX1234",
    });

    expect(rule.pattern).toContain("[private field removed]");
  });
});
