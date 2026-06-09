import { z } from "zod";
import { centsSchema } from "@/lib/validation/money";

export const splitTotalSchema = z.object({
  parentAmountCents: centsSchema,
  childAmountsCents: z.array(centsSchema).min(1),
});

export function validateSplitTotal(input: z.infer<typeof splitTotalSchema>) {
  const { parentAmountCents, childAmountsCents } = splitTotalSchema.parse(input);
  const childTotalCents = childAmountsCents.reduce((total, amountCents) => total + amountCents, 0);

  if (childTotalCents !== parentAmountCents) {
    throw new Error("Split child transaction totals must equal the split parent amount in cents.");
  }

  return { parentAmountCents, childTotalCents };
}

export function shouldCountTransactionInTotals(splitRole: "NONE" | "PARENT" | "CHILD", deletedAt?: Date | null) {
  return !deletedAt && splitRole !== "PARENT";
}
