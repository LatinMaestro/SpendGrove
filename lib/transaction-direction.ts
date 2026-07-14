import type { ManualCategoryType } from "@/lib/manual-categories";

export type TransactionDirectionReasonCode =
  | "ZERO_AMOUNT"
  | "TYPE_SIGN_MISMATCH"
  | "CATEGORY_DIRECTION_MISMATCH"
  | "SPLIT_SIGN_MISMATCH"
  | "SPLIT_TYPE_MISMATCH";

export class TransactionDirectionError extends Error {
  constructor(
    message: string,
    readonly reasonCode: TransactionDirectionReasonCode,
  ) {
    super(message);
    this.name = "TransactionDirectionError";
  }
}

function assertNonZeroIntegerCents(amountCents: number) {
  if (!Number.isSafeInteger(amountCents) || amountCents === 0) {
    throw new TransactionDirectionError(
      "Enter a non-zero transaction amount.",
      "ZERO_AMOUNT",
    );
  }
}

export function deriveTransactionType(
  amountCents: number,
  confirmedTransfer = false,
): ManualCategoryType {
  assertNonZeroIntegerCents(amountCents);
  if (confirmedTransfer) return "TRANSFER";
  return amountCents > 0 ? "INCOME" : "EXPENSE";
}

export function normaliseAmountForTransactionType(
  type: ManualCategoryType,
  amountCents: number,
) {
  assertNonZeroIntegerCents(amountCents);
  if (type === "EXPENSE") return -Math.abs(amountCents);
  if (type === "INCOME") return Math.abs(amountCents);
  return amountCents;
}

export function isTransactionTypeCompatible(
  type: ManualCategoryType | string,
  amountCents: number,
) {
  if (!Number.isSafeInteger(amountCents) || amountCents === 0) return false;
  if (type === "TRANSFER") return true;
  return type === deriveTransactionType(amountCents);
}

export function assertTransactionTypeCompatible(
  type: ManualCategoryType | string,
  amountCents: number,
) {
  if (!isTransactionTypeCompatible(type, amountCents)) {
    throw new TransactionDirectionError(
      "The amount and transaction direction do not agree.",
      "TYPE_SIGN_MISMATCH",
    );
  }
}

export function isCategoryTypeCompatible(
  categoryType: ManualCategoryType | string,
  transactionType: ManualCategoryType | string,
) {
  return categoryType === transactionType;
}

export function assertCategoryTypeCompatible(
  categoryType: ManualCategoryType | string,
  transactionType: ManualCategoryType | string,
) {
  if (!isCategoryTypeCompatible(categoryType, transactionType)) {
    const direction = transactionType === "INCOME"
      ? "money in"
      : transactionType === "EXPENSE"
        ? "money out"
        : "a transfer";
    throw new TransactionDirectionError(
      `Choose a category for ${direction}.`,
      "CATEGORY_DIRECTION_MISMATCH",
    );
  }
}

export function transactionNeedsDirectionCorrection(input: {
  type: ManualCategoryType | string;
  amountCents: number;
}) {
  return !isTransactionTypeCompatible(input.type, input.amountCents);
}

export function transactionDirectionLabel(
  type: ManualCategoryType | string,
  amountCents: number,
) {
  if (type === "TRANSFER") {
    return amountCents > 0 ? "Incoming transfer" : "Outgoing transfer";
  }
  return amountCents > 0 ? "Money in" : "Money out";
}

export function directionCompatibleFallbackCategoryName(amountCents: number) {
  return deriveTransactionType(amountCents) === "INCOME" ? "Other income" : "Needs review";
}

export function validateSplitDirection(input: {
  parentAmountCents: number;
  parentType: ManualCategoryType;
  children: Array<{ amountCents: number; type: ManualCategoryType }>;
}) {
  assertTransactionTypeCompatible(input.parentType, input.parentAmountCents);
  for (const child of input.children) {
    assertTransactionTypeCompatible(child.type, child.amountCents);
    if (Math.sign(child.amountCents) !== Math.sign(input.parentAmountCents)) {
      throw new TransactionDirectionError(
        "Split transactions must use the same money direction.",
        "SPLIT_SIGN_MISMATCH",
      );
    }
    if (child.type !== input.parentType) {
      throw new TransactionDirectionError(
        "Split transaction types must match the parent transaction.",
        "SPLIT_TYPE_MISMATCH",
      );
    }
  }
  return input;
}
