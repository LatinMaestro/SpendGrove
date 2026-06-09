import { z } from "zod";

export const userStatusSchema = z.enum(["ACTIVE", "DISABLED", "DELETED"]);
export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);
export const transactionSourceSchema = z.enum(["MANUAL", "IMPORTED"]);
export const transactionStatusSchema = z.enum(["ACTIVE", "NEEDS_REVIEW", "DELETED"]);
export const splitRoleSchema = z.enum(["NONE", "PARENT", "CHILD"]);
export const importTypeSchema = z.enum(["TRANSACTION_CSV"]);
export const importBatchStatusSchema = z.enum([
  "CREATED",
  "SCANNING",
  "MAPPING_REQUIRED",
  "REVIEW_READY",
  "REVIEWING",
  "CONFIRMING",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
]);
export const importRowActionSchema = z.enum(["UNDECIDED", "IMPORT", "SKIP", "MERGE"]);
export const importRowStatusSchema = z.enum([
  "NEEDS_REVIEW",
  "READY",
  "WARNING",
  "COMMITTED",
  "SKIPPED",
  "MERGED",
  "FAILED",
]);
export const categoryTypeSchema = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);
export const merchantRuleTypeSchema = z.enum(["EXACT", "CONTAINS", "STARTS_WITH", "REGEX"]);
export const auditEntityTypeSchema = z.enum([
  "USER",
  "SETTINGS",
  "CATEGORY",
  "TRANSACTION",
  "IMPORT_BATCH",
  "IMPORT_ROW",
  "BANK_IMPORT_PROFILE",
  "MERCHANT_PROFILE",
  "MERCHANT_ALIAS",
  "MERCHANT_RULE",
]);
export const auditActionSchema = z.enum([
  "CREATED",
  "UPDATED",
  "DELETED",
  "ARCHIVED",
  "DEACTIVATED",
  "IMPORTED",
  "SKIPPED",
  "MERGED",
  "REVIEWED",
  "PRIVACY_FIELDS_EXCLUDED",
]);

export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionSource = z.infer<typeof transactionSourceSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
export type SplitRole = z.infer<typeof splitRoleSchema>;
export type ImportRowAction = z.infer<typeof importRowActionSchema>;
export type ImportRowStatus = z.infer<typeof importRowStatusSchema>;
export type CategoryType = z.infer<typeof categoryTypeSchema>;
export type MerchantRuleType = z.infer<typeof merchantRuleTypeSchema>;
