export type ImportFlowStep = "UPLOAD" | "MAPPING" | "REVIEW";

export function moveToMappingStep(hasCheckedFile: boolean): ImportFlowStep {
  if (!hasCheckedFile) throw new Error("Choose and check a CSV file first.");
  return "MAPPING";
}

export function moveToReviewStep(mappingIssues: string[]): ImportFlowStep {
  if (mappingIssues.length > 0) {
    throw new Error("Match the required columns before continuing.");
  }
  return "REVIEW";
}

export function moveBackFromReview(): ImportFlowStep {
  return "MAPPING";
}

export function resetImportFlow(): ImportFlowStep {
  return "UPLOAD";
}
