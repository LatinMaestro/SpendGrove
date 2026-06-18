import { z } from "zod";
import { merchantRuleTypeSchema } from "@/lib/validation/enums";
import {
  containsPrivateBankIdentifier,
  normalizeSafeText,
} from "@/lib/validation/privacy";

const merchantNameSchema = z.string()
  .trim()
  .min(1)
  .max(160)
  .refine((value) => !containsPrivateBankIdentifier(value), "Private banking identifiers are not permitted in merchant storage.")
  .transform(normalizeSafeText);

const normalizedMerchantNameSchema = merchantNameSchema.transform((value) => value.toLocaleLowerCase("en-AU"));

// Preserve the established MerchantRule behavior: private fragments are sanitised
// by normalizeSafeText instead of rejecting the full rule input.
const merchantRulePatternSchema = z.string()
  .trim()
  .min(1)
  .max(160)
  .transform(normalizeSafeText);

const normalizedMerchantRulePatternSchema = merchantRulePatternSchema.transform((value) => value.toLowerCase());

export const merchantProfileSchema = z.object({
  userId: z.string().min(1),
  name: merchantNameSchema,
  normalizedName: normalizedMerchantNameSchema,
  defaultCategoryId: z.string().min(1).optional(),
  isActive: z.boolean().default(true),
  deletedAt: z.coerce.date().nullable().optional(),
}).strict().superRefine((value, context) => {
  if (value.normalizedName !== value.name.toLocaleLowerCase("en-AU")) {
    context.addIssue({
      code: "custom",
      path: ["normalizedName"],
      message: "Normalised merchant name must match the safe lower-case merchant name.",
    });
  }
});

export const merchantAliasSchema = z.object({
  userId: z.string().min(1),
  merchantProfileId: z.string().min(1),
  aliasName: merchantNameSchema,
  normalizedAlias: normalizedMerchantNameSchema,
  isActive: z.boolean().default(true),
  deactivatedAt: z.coerce.date().nullable().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
}).strict().superRefine((value, context) => {
  if (value.normalizedAlias !== value.aliasName.toLocaleLowerCase("en-AU")) {
    context.addIssue({
      code: "custom",
      path: ["normalizedAlias"],
      message: "Normalised alias must match the safe lower-case alias name.",
    });
  }
});

const merchantRuleFields = z.object({
  userId: z.string().min(1),
  merchantProfileId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  type: merchantRuleTypeSchema,
  pattern: merchantRulePatternSchema,
  normalizedPattern: normalizedMerchantRulePatternSchema,
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
  pattern: merchantRulePatternSchema.optional(),
  normalizedPattern: normalizedMerchantRulePatternSchema.optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
  deactivatedAt: z.coerce.date().nullable().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
}).strict();
