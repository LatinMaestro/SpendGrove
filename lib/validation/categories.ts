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
}).strict();

export const categoryUpdateSchema = z.object({
  name: categoryNameSchema.optional(),
  type: categoryTypeSchema.optional(),
  parentId: z.string().min(1).nullable().optional(),
  colour: z.string().trim().max(40).nullable().optional(),
  icon: z.string().trim().max(40).nullable().optional(),
  isArchived: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
}).strict();

export function assertValidCategoryParent(categoryId: string, parentId?: string | null, proposedParentAncestorIds: string[] = []) {
  if (parentId && parentId === categoryId) {
    throw new Error("A category cannot be its own parent.");
  }

  if (proposedParentAncestorIds.includes(categoryId)) {
    throw new Error("A category cannot be moved beneath one of its descendants.");
  }
}
