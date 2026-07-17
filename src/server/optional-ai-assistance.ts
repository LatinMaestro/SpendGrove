import { z } from "zod";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { PHASE_12_AI_ASSISTANCE_RUNTIME_ENABLED } from "@/src/server/phase-12-runtime";

export type AiAssistanceAdapter = {
  assist(input: z.infer<typeof aiAssistanceRequestSchema>): Promise<unknown>;
};

export class AiAssistanceUnavailableError extends Error {
  constructor() {
    super("Optional assistance is not available.");
    this.name = "AiAssistanceUnavailableError";
  }
}

const safeLabelSchema = z.string().trim().min(1).max(80)
  .transform((value) => value.replace(/\s+/g, " "))
  .refine((value) => !/@|\b(?:bsb|account|acct|card|customer|member|loan)\b/i.test(value))
  .refine((value) => !/\d{4,}/.test(value));

const categoriseRequest = z.object({
  mode: z.literal("CATEGORISE"),
  direction: z.enum(["MONEY_IN", "MONEY_OUT"]),
  cleanedMerchant: safeLabelSchema,
  categories: z.array(z.object({
    key: z.string().trim().min(1).max(80),
    label: safeLabelSchema,
  }).strict()).min(1).max(100),
}).strict();

const searchRequest = z.object({
  mode: z.literal("SEARCH"),
  intent: z.enum(["LIST_TRANSACTIONS", "SUM_SPENDING", "CATEGORY_BREAKDOWN"]),
  month: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
  categoryKey: z.string().trim().min(1).max(80).nullable(),
  direction: z.enum(["MONEY_IN", "MONEY_OUT", "TRANSFER"]).nullable(),
}).strict();

const budgetRequest = z.object({
  mode: z.literal("BUDGET_EXPLANATION"),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  categories: z.array(z.object({
    label: safeLabelSchema,
    spentCents: z.number().int().min(0),
    budgetCents: z.number().int().positive(),
  }).strict()).min(1).max(20),
}).strict();

const anomalyRequest = z.object({
  mode: z.literal("ANOMALY"),
  reasonCode: z.enum([
    "UNUSUAL_CATEGORY_TOTAL",
    "RECURRING_PAYMENT_CHANGED",
    "BUDGET_THRESHOLD_REACHED",
  ]),
  aggregateCount: z.number().int().min(1).max(1000),
}).strict();

const helpRequest = z.object({
  mode: z.literal("HELP"),
  topic: z.enum([
    "CSV_IMPORT",
    "TRANSACTIONS",
    "BUDGETS",
    "REGULAR_PAYMENTS",
    "LOANS",
    "PROPERTY_RECORDS",
    "PRIVACY",
  ]),
}).strict();

export const aiAssistanceRequestSchema = z.discriminatedUnion("mode", [
  categoriseRequest,
  searchRequest,
  budgetRequest,
  anomalyRequest,
  helpRequest,
]);

const aiAssistanceResultSchema = z.object({
  summary: z.string().trim().min(1).max(500),
  suggestedCategoryKey: z.string().trim().min(1).max(80).nullable().optional(),
  searchPlan: z.object({
    intent: z.enum(["LIST_TRANSACTIONS", "SUM_SPENDING", "CATEGORY_BREAKDOWN"]),
    month: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
    categoryKey: z.string().trim().min(1).max(80).nullable(),
    direction: z.enum(["MONEY_IN", "MONEY_OUT", "TRANSFER"]).nullable(),
  }).strict().nullable().optional(),
}).strict();

type Options = {
  runtimeEnabled?: boolean;
  userOptIn?: boolean;
};

export async function requestOptionalAiAssistance(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  adapter: AiAssistanceAdapter | null,
  options: Options = {},
) {
  requireAuthenticatedUserContext(context);
  if (
    !(options.runtimeEnabled ?? PHASE_12_AI_ASSISTANCE_RUNTIME_ENABLED)
    || !options.userOptIn
    || !adapter
  ) {
    throw new AiAssistanceUnavailableError();
  }

  const request = aiAssistanceRequestSchema.parse(input);
  const raw = await adapter.assist(request);
  const parsed = aiAssistanceResultSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      type: "NO_SUGGESTION" as const,
      reason: "PROVIDER_RESULT_UNUSABLE" as const,
    };
  }

  return {
    type: "ASSISTANCE" as const,
    ...parsed.data,
    userConfirmationRequired: request.mode === "CATEGORISE",
    readOnly: true as const,
  };
}
