import type { ImportReviewRow } from "@/lib/import-review";
import { canonicalMerchantDisplayName } from "@/lib/import-review-merchant-identity";
import { normalizeMerchantName, saveConfirmedMerchantRule, saveMerchantAlias, type LocalMerchantData, type MerchantConflictResolution } from "@/lib/merchant-rules";
import { containsPrivateBankIdentifier } from "@/lib/validation/privacy";

export function learnMerchantCategory(data: LocalMerchantData, row: Pick<ImportReviewRow, "merchantName" | "categoryId">, resolution?: MerchantConflictResolution) {
  if (containsPrivateBankIdentifier(row.merchantName)) {
    throw new Error("Private banking identifiers are not permitted.");
  }
  const canonicalName = canonicalMerchantDisplayName(row.merchantName);
  return saveConfirmedMerchantRule(data, { merchantName: canonicalName, categoryId: row.categoryId, resolution });
}

export function learnEditedMerchantName(data: LocalMerchantData, input: { previousMerchantName: string; merchantName: string; categoryId: string; resolution?: MerchantConflictResolution }) {
  if (normalizeMerchantName(input.previousMerchantName) === normalizeMerchantName(input.merchantName)) {
    return saveConfirmedMerchantRule(data, { merchantName: input.merchantName, categoryId: input.categoryId, resolution: input.resolution });
  }
  return saveMerchantAlias(data, { alias: input.previousMerchantName, canonicalName: input.merchantName, categoryId: input.categoryId, resolution: input.resolution });
}
