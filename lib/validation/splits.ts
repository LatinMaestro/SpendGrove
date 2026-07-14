import { z } from "zod";
import { centsSchema } from "@/lib/validation/money";
import { deriveTransactionType, validateSplitDirection } from "@/lib/transaction-direction";
import type { ManualCategoryType } from "@/lib/manual-categories";

export const splitTotalSchema = z.object({
  parentAmountCents: centsSchema,
  childAmountsCents: z.array(centsSchema).min(1),
});

export function validateSplitTotal(input: z.infer<typeof splitTotalSchema>) {
  const { parentAmountCents, childAmountsCents } = splitTotalSchema.parse(input);
  deriveTransactionType(parentAmountCents);
  childAmountsCents.forEach((amountCents) => {
    deriveTransactionType(amountCents);
    if (Math.sign(amountCents) !== Math.sign(parentAmountCents)) {
      throw new Error("Split child transactions must use the same money direction as the parent.");
    }
  });
  const childTotalCents = childAmountsCents.reduce((total, amountCents) => total + amountCents, 0);

  if (childTotalCents !== parentAmountCents) {
    throw new Error("Split child transaction totals must equal the split parent amount in cents.");
  }

  return { parentAmountCents, childTotalCents };
}

export function validateSplitTransactionDirection(input: {
  parentAmountCents: number;
  parentType: ManualCategoryType;
  children: Array<{ amountCents: number; type: ManualCategoryType }>;
}) {
  validateSplitTotal({
    parentAmountCents: input.parentAmountCents,
    childAmountsCents: input.children.map((child) => child.amountCents),
  });
  return validateSplitDirection(input);
}

export function shouldCountTransactionInTotals(splitRole: "NONE" | "PARENT" | "CHILD", deletedAt?: Date | null) {
  return !deletedAt && splitRole !== "PARENT";
}
