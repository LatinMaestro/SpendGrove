import { describe, expect, it } from "vitest";
import {
  moveBackFromReview,
  moveToMappingStep,
  moveToReviewStep,
  resetImportFlow,
} from "@/lib/import-flow";

describe("import flow", () => {
  it("moves to column matching after a CSV is checked", () => {
    expect(moveToMappingStep(true)).toBe("MAPPING");
  });

  it("does not leave upload before a CSV is checked", () => {
    expect(() => moveToMappingStep(false)).toThrow("Choose and check a CSV file first.");
  });

  it("moves to transaction review after required columns are matched", () => {
    expect(moveToReviewStep([])).toBe("REVIEW");
  });

  it("does not start review while required mappings need attention", () => {
    expect(() => moveToReviewStep(["Choose a transaction date column."])).toThrow(
      "Match the required columns before continuing.",
    );
  });

  it("returns from review to column matching without resetting the file", () => {
    expect(moveBackFromReview()).toBe("MAPPING");
  });

  it("returns to the upload step when the flow is reset", () => {
    expect(resetImportFlow()).toBe("UPLOAD");
  });
});
