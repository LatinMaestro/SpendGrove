import { z } from "zod";
import {
  getManualCategory,
  type ManualCategoryType,
} from "@/lib/manual-categories";
import { parseMoneyToCents } from "@/lib/validation/money";
import { normalizeSafeText } from "@/lib/validation/privacy";
import { normaliseAmountForTransactionType } from "@/lib/transaction-direction";

export const MANUAL_TRANSACTION_STORAGE_KEY = "spendgrove.phase1.transactions.v1";
export const MANUAL_TRANSACTION_STORAGE_VERSION = 1 as const;

export type ManualTransactionType = ManualCategoryType;

export type ManualTransaction = {
  id: string;
  type: ManualTransactionType;
  source: "MANUAL";
  amountCents: number;
  date: string;
  description: string;
  categoryId: string;
  notes: string;
  csvMatchHint: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ManualTransactionDraft = {
  type: ManualTransactionType;
  amountInput: string;
  date: string;
  description: string;
  categoryId: string;
  notes: string;
  csvMatchHint: boolean;
};

export type ManualTransactionStorageResult = {
  transactions: ManualTransaction[];
  recoveredFromCorruption: boolean;
};

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid transaction date.");

const storedTransactionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  source: z.literal("MANUAL"),
  amountCents: z.number().int().safe().refine((value) => value !== 0),
  date: dateOnlySchema,
  description: z.string().min(1).max(300),
  categoryId: z.string().min(1),
  notes: z.string().max(300),
  csvMatchHint: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
}).strict().superRefine((transaction, context) => {
  const category = getManualCategory(transaction.categoryId);
  if (!category || category.type !== transaction.type) {
    context.addIssue({
      code: "custom",
      path: ["categoryId"],
      message: "Choose an approved category that matches the transaction type.",
    });
  }
});

const storageEnvelopeSchema = z.object({
  version: z.literal(MANUAL_TRANSACTION_STORAGE_VERSION),
  transactions: z.array(storedTransactionSchema),
}).strict();

const transactionDraftSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amountInput: z.string().trim().min(1, "Enter an AUD amount."),
  date: dateOnlySchema,
  description: z.string().trim().min(1, "Enter a description.").max(300).transform(normalizeSafeText),
  categoryId: z.string().min(1, "Choose a category."),
  notes: z.string().trim().max(300).transform(normalizeSafeText),
  csvMatchHint: z.boolean(),
}).strict().superRefine((draft, context) => {
  const category = getManualCategory(draft.categoryId);
  if (!category || category.type !== draft.type) {
    context.addIssue({
      code: "custom",
      path: ["categoryId"],
      message: "Choose an approved category that matches the transaction type.",
    });
  }

  try {
    if (parseMoneyToCents(draft.amountInput) === 0) {
      context.addIssue({ code: "custom", path: ["amountInput"], message: "Amount must not be zero." });
    }
  } catch (error) {
    context.addIssue({
      code: "custom",
      path: ["amountInput"],
      message: error instanceof Error ? error.message : "Enter a valid AUD amount.",
    });
  }
});

function createLocalId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function applyTypeSign(type: ManualTransactionType, parsedCents: number) {
  return normaliseAmountForTransactionType(type, parsedCents);
}

export function validateManualTransactionDraft(draft: ManualTransactionDraft) {
  const validated = transactionDraftSchema.parse(draft);
  return {
    ...validated,
    amountCents: applyTypeSign(validated.type, parseMoneyToCents(validated.amountInput)),
  };
}

export function createManualTransaction(
  transactions: ManualTransaction[],
  draft: ManualTransactionDraft,
  options: { id?: string; now?: Date } = {},
) {
  const validated = validateManualTransactionDraft(draft);
  const timestamp = (options.now ?? new Date()).toISOString();
  const transaction: ManualTransaction = storedTransactionSchema.parse({
    id: options.id ?? createLocalId(),
    type: validated.type,
    source: "MANUAL",
    amountCents: validated.amountCents,
    date: validated.date,
    description: validated.description,
    categoryId: validated.categoryId,
    notes: validated.notes,
    csvMatchHint: validated.csvMatchHint,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  });

  return [...transactions, transaction];
}

export function updateManualTransaction(
  transactions: ManualTransaction[],
  transactionId: string,
  draft: ManualTransactionDraft,
  now = new Date(),
) {
  const validated = validateManualTransactionDraft(draft);
  let found = false;
  const updated = transactions.map((transaction) => {
    if (transaction.id !== transactionId || transaction.deletedAt) return transaction;
    found = true;
    return storedTransactionSchema.parse({
      ...transaction,
      type: validated.type,
      amountCents: validated.amountCents,
      date: validated.date,
      description: validated.description,
      categoryId: validated.categoryId,
      notes: validated.notes,
      csvMatchHint: validated.csvMatchHint,
      updatedAt: now.toISOString(),
    });
  });

  if (!found) throw new Error("The transaction could not be found.");
  return updated;
}

export function softDeleteManualTransaction(
  transactions: ManualTransaction[],
  transactionId: string,
  now = new Date(),
) {
  let found = false;
  const deletedAt = now.toISOString();
  const updated = transactions.map((transaction) => {
    if (transaction.id !== transactionId || transaction.deletedAt) return transaction;
    found = true;
    return { ...transaction, deletedAt, updatedAt: deletedAt };
  });

  if (!found) throw new Error("The transaction could not be found.");
  return updated;
}

export function listActiveManualTransactions(transactions: ManualTransaction[]) {
  return transactions
    .filter((transaction) => !transaction.deletedAt)
    .sort((left, right) => {
      const dateDifference = right.date.localeCompare(left.date);
      return dateDifference || right.updatedAt.localeCompare(left.updatedAt);
    });
}

function formatDraftAmount(transaction: Pick<ManualTransaction, "type" | "amountCents">) {
  const cents = transaction.type === "TRANSFER" ? transaction.amountCents : Math.abs(transaction.amountCents);
  return (cents / 100).toFixed(2);
}

export function duplicateManualTransactionToDraft(
  transaction: Pick<ManualTransaction, "type" | "amountCents" | "date" | "description" | "categoryId" | "notes" | "csvMatchHint">,
): ManualTransactionDraft {
  return {
    type: transaction.type,
    amountInput: formatDraftAmount(transaction),
    date: transaction.date,
    description: transaction.description,
    categoryId: transaction.categoryId,
    notes: transaction.notes,
    csvMatchHint: transaction.csvMatchHint,
  };
}

function normalizeDuplicateDescription(description: string) {
  return normalizeSafeText(description).toLocaleLowerCase("en-AU");
}

export function findManualTransactionDuplicates(
  transactions: ManualTransaction[],
  candidate: Pick<ManualTransaction, "amountCents" | "date" | "description">,
  excludeTransactionId?: string,
) {
  const normalizedDescription = normalizeDuplicateDescription(candidate.description);
  return listActiveManualTransactions(transactions).filter(
    (transaction) =>
      transaction.id !== excludeTransactionId &&
      transaction.amountCents === candidate.amountCents &&
      transaction.date === candidate.date &&
      normalizeDuplicateDescription(transaction.description) === normalizedDescription,
  );
}

export function parseManualTransactionStorage(rawValue: string | null): ManualTransactionStorageResult {
  if (!rawValue) return { transactions: [], recoveredFromCorruption: false };

  try {
    const parsed = storageEnvelopeSchema.safeParse(JSON.parse(rawValue));
    if (!parsed.success) return { transactions: [], recoveredFromCorruption: true };
    return { transactions: parsed.data.transactions, recoveredFromCorruption: false };
  } catch {
    return { transactions: [], recoveredFromCorruption: true };
  }
}

export function serializeManualTransactionStorage(transactions: ManualTransaction[]) {
  return JSON.stringify(storageEnvelopeSchema.parse({
    version: MANUAL_TRANSACTION_STORAGE_VERSION,
    transactions,
  }));
}

export function formatAustralianTransactionDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
