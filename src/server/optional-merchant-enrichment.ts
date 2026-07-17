import { z } from "zod";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { PHASE_12_BASIQ_ENRICHMENT_RUNTIME_ENABLED } from "@/src/server/phase-12-runtime";

export type LocalMerchantSuggestion = {
  merchantName: string;
  categoryKey: string;
  source: "USER_RULE" | "USER_ALIAS" | "LOCAL_HISTORY" | "LOCAL_KEYWORD";
};

export type MerchantEnrichmentAdapter = {
  enrich(input: {
    cleanedMerchant: string;
    country: "AU";
    institutionCode: string;
    accountType?: "transaction" | "credit-card" | "savings";
  }): Promise<unknown>;
};

export class MerchantEnrichmentUnavailableError extends Error {
  constructor() {
    super("Enhanced merchant lookup is not available.");
    this.name = "MerchantEnrichmentUnavailableError";
  }
}

const privateIdentifierPattern = /\b(?:bsb|account|acct|card|customer|member|loan)\s*(?:no|number|id|ref|#)\b/i;

const cleanedMerchantSchema = z.string().trim().min(3).max(120)
  .transform((value) => value.replace(/\s+/g, " "))
  .refine((value) => !/@/.test(value))
  .refine((value) => !privateIdentifierPattern.test(value))
  .refine((value) => !/\d{4,}/.test(value));

const safeSuggestionLabelSchema = z.string().trim().min(1).max(80)
  .transform((value) => value.replace(/\s+/g, " "))
  .refine((value) => !/@/.test(value))
  .refine((value) => !/\d{4,}/.test(value));

const localSuggestionSchema = z.object({
  merchantName: safeSuggestionLabelSchema,
  categoryKey: z.string().trim().min(1).max(80),
  source: z.enum(["USER_RULE", "USER_ALIAS", "LOCAL_HISTORY", "LOCAL_KEYWORD"]),
}).strict();

const requestSchema = z.object({
  cleanedMerchant: cleanedMerchantSchema,
  direction: z.enum(["MONEY_IN", "MONEY_OUT", "TRANSFER"]),
  institutionCode: z.string().regex(/^AU\d{5}$/),
  accountType: z.enum(["transaction", "credit-card", "savings"]).optional(),
}).strict();

const providerSuggestionSchema = z.object({
  merchantName: safeSuggestionLabelSchema,
  categoryKey: z.string().trim().min(1).max(80),
}).strict();

type Options = {
  runtimeEnabled?: boolean;
  enhancedLookupOptIn?: boolean;
};

export async function suggestMerchantWithOptionalEnrichment(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  localSuggestion: LocalMerchantSuggestion | null,
  adapter: MerchantEnrichmentAdapter | null,
  options: Options = {},
) {
  requireAuthenticatedUserContext(context);

  if (localSuggestion) {
    const parsedLocal = localSuggestionSchema.parse(localSuggestion);
    return {
      type: "SUGGESTION" as const,
      source: parsedLocal.source,
      merchantName: parsedLocal.merchantName,
      categoryKey: parsedLocal.categoryKey,
      userConfirmationRequired: true,
    };
  }

  if (
    !(options.runtimeEnabled ?? PHASE_12_BASIQ_ENRICHMENT_RUNTIME_ENABLED)
    || !options.enhancedLookupOptIn
    || !adapter
  ) {
    throw new MerchantEnrichmentUnavailableError();
  }

  const request = requestSchema.parse(input);
  if (request.direction === "TRANSFER") {
    return { type: "NO_SUGGESTION" as const, reason: "TRANSFER_REQUIRES_LOCAL_REVIEW" as const };
  }

  const raw = await adapter.enrich({
    cleanedMerchant: request.cleanedMerchant,
    country: "AU",
    institutionCode: request.institutionCode,
    ...(request.accountType ? { accountType: request.accountType } : {}),
  });
  const parsed = providerSuggestionSchema.safeParse(raw);
  if (!parsed.success) {
    return { type: "NO_SUGGESTION" as const, reason: "PROVIDER_RESULT_UNUSABLE" as const };
  }

  return {
    type: "SUGGESTION" as const,
    source: "OPTIONAL_ENRICHMENT" as const,
    merchantName: parsed.data.merchantName,
    categoryKey: parsed.data.categoryKey,
    userConfirmationRequired: true,
  };
}
