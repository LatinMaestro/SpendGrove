import { z } from "zod";
import { merchantRuleTypeSchema } from "@/lib/validation/enums";
import { normalizeSafeText } from "@/lib/validation/privacy";

const merchantNameSchema = z.string().trim().min(1).max(160).transform(normalizeSafeText);

export const merchantProfileSchema = z.object({
  userId: z.string().min(1),
  name: merchantNameSchema,
  defaultCategoryId: z.string().min(1).optional(),
}).strict();

export const merchantAliasSchema = z.object({
  userId: z.string().min(1),
  merchantProfileId: z.string().min(1),
  rawAlias: merchantNameSchema,
  normalizedAlias: merchantNameSchema.transform((value) => value.toLowerCase()),
}).strict();

const merchantRuleFields = z.object({
  userId: z.string().min(1),
  merchantProfileId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  type: merchantRuleTypeSchema,
  pattern: merchantNameSchema,
  normalizedPattern: merchantNameSchema.transform((value) => value.toLowerCase()),
  priority: z.number().int().min(0).max(1000).default(100),
  isActive: z.boolean().default(true),
}).strict();

export const merchantRuleCreateSchema = merchantRuleFields.superRefine((value, context) => {
  if (value.normalizedPattern !== value.pattern.toLowerCase()) {
    context.addIssue({ code: "custom", path: ["normalizedPattern"], message: "Normalised pattern must match the safe lower-case merchant pattern." });
  }
});

export const merchantRuleUpdateSchema = z.object({
  merchantProfileId: z.string().min(1).nullable().optional(),
  categoryId: z.string().min(1).nullable().optional(),
  type: merchantRuleTypeSchema.optional(),
  pattern: merchantNameSchema.optional(),
  normalizedPattern: merchantNameSchema.transform((value) => value.toLowerCase()).optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
  deactivatedAt: z.coerce.date().nullable().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
}).strict();
