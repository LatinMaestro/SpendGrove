import { z } from "zod";
import { merchantRuleTypeSchema } from "@/lib/validation/enums";
import { normalizeSafeText } from "@/lib/validation/privacy";

const merchantNameSchema = z.string().trim().min(1).max(160).transform(normalizeSafeText);

export const merchantProfileSchema = z.object({
  userId: z.string().min(1),
  name: merchantNameSchema,
  defaultCategoryId: z.string().min(1).optional(),
});

export const merchantAliasSchema = z.object({
  userId: z.string().min(1),
  merchantProfileId: z.string().min(1),
  rawAlias: merchantNameSchema,
  normalizedAlias: merchantNameSchema.transform((value) => value.toLowerCase()),
});

export const merchantRuleCreateSchema = z.object({
  userId: z.string().min(1),
  merchantProfileId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  type: merchantRuleTypeSchema,
  pattern: merchantNameSchema,
  normalizedPattern: merchantNameSchema.transform((value) => value.toLowerCase()),
  priority: z.number().int().min(0).max(1000).default(100),
  isActive: z.boolean().default(true),
});

export const merchantRuleUpdateSchema = merchantRuleCreateSchema
  .omit({ userId: true })
  .partial()
  .extend({
    deactivatedAt: z.date().nullable().optional(),
    deletedAt: z.date().nullable().optional(),
  });
