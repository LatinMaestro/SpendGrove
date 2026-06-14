import { z } from "zod";
import type { CsvColumnRole, CsvScanResult } from "@/lib/csv-import";
import {
  assertNoPrivateBankIdentifiers,
  normalizeSafeText,
} from "@/lib/validation/privacy";

export const SAFE_IMPORT_PROFILE_VERSION = 1 as const;

export const importProfileAccountTypeSchema = z.enum([
  "EVERYDAY_TRANSACTION",
  "SAVINGS",
  "CREDIT_CARD",
  "OFFSET",
  "UNKNOWN",
]);

export type ImportProfileAccountType = z.infer<typeof importProfileAccountTypeSchema>;

const storedColumnRoleSchema = z.enum([
  "DATE",
  "AMOUNT",
  "DEBIT",
  "CREDIT",
  "DESCRIPTION",
  "MERCHANT",
]);

const safeProfileLabelSchema = z.string()
  .trim()
  .min(1)
  .max(120)
  .transform(normalizeSafeText)
  .superRefine((value, context) => {
    try {
      assertNoPrivateBankIdentifiers(value, "profile label");
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Profile labels must not contain private identifiers.",
      });
    }
  });

export const safeImportProfileContractSchema = z.object({
  version: z.literal(SAFE_IMPORT_PROFILE_VERSION),
  displayName: safeProfileLabelSchema,
  bankName: safeProfileLabelSchema.optional(),
  accountType: importProfileAccountTypeSchema,
  hasHeader: z.boolean(),
  columnCount: z.number().int().min(2).max(100),
  columnRoles: z.array(z.object({
    columnIndex: z.number().int().nonnegative(),
    role: storedColumnRoleSchema,
  }).strict()).min(3),
  ignoredColumnIndexes: z.array(z.number().int().nonnegative()).default([]),
  privateColumnIndexes: z.array(z.number().int().nonnegative()).default([]),
  dateFormats: z.array(z.enum([
    "YYYY-MM-DD",
    "DD/MM/YYYY",
    "DD-MM-YYYY",
    "DD/MM/YY",
    "DD-MM-YY",
  ])).default([]),
  amountMode: z.enum(["SIGNED_AMOUNT", "DEBIT_CREDIT"]),
  confidence: z.number().int().min(0).max(100),
}).strict().superRefine((profile, context) => {
  const allIndexes = [
    ...profile.columnRoles.map((entry) => entry.columnIndex),
    ...profile.ignoredColumnIndexes,
    ...profile.privateColumnIndexes,
  ];
  const duplicates = allIndexes.filter((value, index) => allIndexes.indexOf(value) !== index);
  if (duplicates.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["columnRoles"],
      message: "Each profile column index must have one safe purpose only.",
    });
  }

  if (allIndexes.some((index) => index >= profile.columnCount)) {
    context.addIssue({
      code: "custom",
      path: ["columnCount"],
      message: "Profile column indexes must fit within the declared column count.",
    });
  }

  const roles = profile.columnRoles.map((entry) => entry.role);
  if (!roles.includes("DATE")) {
    context.addIssue({ code: "custom", path: ["columnRoles"], message: "A saved profile requires a date column." });
  }
  if (!roles.includes("DESCRIPTION") && !roles.includes("MERCHANT")) {
    context.addIssue({ code: "custom", path: ["columnRoles"], message: "A saved profile requires a description or merchant column." });
  }
  if (profile.amountMode === "SIGNED_AMOUNT" && !roles.includes("AMOUNT")) {
    context.addIssue({ code: "custom", path: ["columnRoles"], message: "Signed-amount profiles require a transaction amount column." });
  }
  if (profile.amountMode === "DEBIT_CREDIT" && (!roles.includes("DEBIT") || !roles.includes("CREDIT"))) {
    context.addIssue({ code: "custom", path: ["columnRoles"], message: "Debit/credit profiles require both money-out and money-in columns." });
  }
});

export type SafeImportProfileContract = z.infer<typeof safeImportProfileContractSchema>;

const storedRoles = new Set<CsvColumnRole>([
  "DATE",
  "AMOUNT",
  "DEBIT",
  "CREDIT",
  "DESCRIPTION",
  "MERCHANT",
]);

export function createSafeImportProfileContract(input: {
  displayName: string;
  bankName?: string;
  accountType: ImportProfileAccountType;
  scan: CsvScanResult;
}) {
  const columnRoles = Object.entries(input.scan.mapping)
    .map(([columnIndex, role]) => ({ columnIndex: Number(columnIndex), role }))
    .filter((entry): entry is { columnIndex: number; role: z.infer<typeof storedColumnRoleSchema> } => storedRoles.has(entry.role));
  const ignoredColumnIndexes = input.scan.columns
    .filter((column) => !column.isPrivate && input.scan.mapping[column.index] === "IGNORE")
    .map((column) => column.index);
  const privateColumnIndexes = input.scan.columns
    .filter((column) => column.isPrivate)
    .map((column) => column.index);

  return safeImportProfileContractSchema.parse({
    version: SAFE_IMPORT_PROFILE_VERSION,
    displayName: input.displayName,
    bankName: input.bankName,
    accountType: input.accountType,
    hasHeader: input.scan.hasHeader,
    columnCount: input.scan.columns.length,
    columnRoles,
    ignoredColumnIndexes,
    privateColumnIndexes,
    dateFormats: input.scan.detectedDateFormats,
    amountMode: input.scan.amountMode,
    confidence: input.scan.profile.confidence,
  });
}
