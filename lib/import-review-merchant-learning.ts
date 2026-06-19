import type { ImportReviewRow } from "@/lib/import-review";
import { canonicalMerchantDisplayName, canonicalMerchantGroupingKey } from "@/lib/import-review-merchant-identity";
import { normalizeMerchantName, saveConfirmedMerchantRule, saveMerchantAlias, type LocalMerchantData, type MerchantConflictResolution } from "@/lib/merchant-rules";

export function learnMerchantCategory(data: LocalMerchantData, row: Pick<ImportReviewRow, "merchantName" | "categoryId">, resolution?: MerchantConflictResolution) {
  const canonicalName = canonicalMerchantDisplayName(row.merchantName);
  if (canonicalMerchantGroupingKey(row.merchantName) !== normalizeMerchantName(row.merchantName)) {
    return saveMerchantAlias(data, { alias: row.merchantName, canonicalName, categoryId: row.categoryId, resolution });
  }
  return saveConfirmedMerchantRule(data, { merchantName: row.merchantName, categoryId: row.categoryId, resolution });
}

export function learnEditedMerchantName(data: LocalMerchantData, input: { previousMerchantName: string; merchantName: string; categoryId: string; resolution?: MerchantConflictResolution }) {
  if (normalizeMerchantName(input.previousMerchantName) === normalizeMerchantName(input.merchantName)) {
    return saveConfirmedMerchantRule(data, { merchantName: input.merchantName, categoryId: input.categoryId, resolution: input.resolution });
  }
  return saveMerchantAlias(data, { alias: input.previousMerchantName, canonicalName: input.merchantName, categoryId: input.categoryId, resolution: input.resolution });
}
