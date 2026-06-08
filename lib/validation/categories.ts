import { z } from "zod";
import { categoryTypeSchema } from "@/lib/validation/enums";

const categoryNameSchema = z.string().trim().min(1).max(80);

export const categoryCreateSchema = z.object({
  userId: z.string().min(1),
  name: categoryNameSchema,
  type: categoryTypeSchema,
  parentId: z.string().min(1).optional(),
  colour: z.string().trim().max(40).optional(),
  icon: z.string().trim().max(40).optional(),
  isSeeded: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const categoryUpdateSchema = categoryCreateSchema
  .omit({ userId: true, isSeeded: true })
  .partial()
  .extend({
    deletedAt: z.date().nullable().optional(),
  });

export function assertValidCategoryParent(categoryId: string, parentId?: string) {
  if (parentId && parentId === categoryId) {
    throw new Error("A category cannot be its own parent.");
  }
}
