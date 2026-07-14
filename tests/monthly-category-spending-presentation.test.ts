import { describe, expect, it } from "vitest";
import {
  formatSpendingPercentage,
  monthlyCategoryColour,
} from "@/components/monthly-category-spending";
import {
  NEEDS_REVIEW_CATEGORY_KEY,
  OTHER_CATEGORY_KEY,
} from "@/lib/monthly-category-spending";

describe("monthly category spending presentation helpers", () => {
  it("does not label positive small percentages as zero", () => {
    expect(formatSpendingPercentage(0, 478046)).toBe("0%");
    expect(formatSpendingPercentage(200, 478046)).toBe("<0.1%");
    expect(formatSpendingPercentage(116535, 478046)).toBe("24.4%");
    expect(formatSpendingPercentage(478046, 478046)).toBe("100%");
  });

  it("keeps category colours deterministic without persistence", () => {
    expect(monthlyCategoryColour("category_council_rates")).toBe(
      monthlyCategoryColour("category_council_rates"),
    );
    expect(monthlyCategoryColour(NEEDS_REVIEW_CATEGORY_KEY)).toBe("#D97706");
    expect(monthlyCategoryColour(OTHER_CATEGORY_KEY)).toBe("#64748B");
  });
});
