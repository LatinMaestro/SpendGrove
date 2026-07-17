import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  AiAssistanceUnavailableError,
  requestOptionalAiAssistance,
} from "@/src/server/optional-ai-assistance";
import {
  MerchantEnrichmentUnavailableError,
  suggestMerchantWithOptionalEnrichment,
} from "@/src/server/optional-merchant-enrichment";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const merchantPath = new URL("../../src/server/optional-merchant-enrichment.ts", import.meta.url);
const aiPath = new URL("../../src/server/optional-ai-assistance.ts", import.meta.url);

type EnrichmentInput = {
  cleanedMerchant: string;
  country: "AU";
  institutionCode: string;
  accountType?: "transaction" | "credit-card" | "savings";
};

describe("Phase 12 disabled optional provider boundaries", () => {
  it("uses a validated reliable local merchant result without any provider call", async () => {
    const enrich = vi.fn(async (_input: EnrichmentInput) => ({}));
    const result = await suggestMerchantWithOptionalEnrichment(
      createTestUserContext("user_1"),
      {},
      {
        merchantName: "Red Rooster",
        categoryKey: "coffee-takeaway",
        source: "USER_RULE",
      },
      { enrich },
    );

    expect(enrich).not.toHaveBeenCalled();
    expect(result).toEqual({
      type: "SUGGESTION",
      source: "USER_RULE",
      merchantName: "Red Rooster",
      categoryKey: "coffee-takeaway",
      userConfirmationRequired: true,
    });
  });

  it("rejects unsafe local suggestion labels before returning them", async () => {
    await expect(suggestMerchantWithOptionalEnrichment(
      createTestUserContext("user_1"),
      {},
      {
        merchantName: "Merchant 12345678",
        categoryKey: "coffee-takeaway",
        source: "USER_RULE",
      },
      null,
    )).rejects.toBeTruthy();
  });

  it("fails closed without runtime, opt-in and adapter", async () => {
    const enrich = vi.fn(async (_input: EnrichmentInput) => ({}));
    await expect(suggestMerchantWithOptionalEnrichment(
      createTestUserContext("user_1"),
      {
        cleanedMerchant: "RED ROOSTER",
        direction: "MONEY_OUT",
        institutionCode: "AU00000",
      },
      null,
      { enrich },
    )).rejects.toBeInstanceOf(MerchantEnrichmentUnavailableError);
    expect(enrich).not.toHaveBeenCalled();

    await expect(requestOptionalAiAssistance(
      createTestUserContext("user_1"),
      { mode: "HELP", topic: "CSV_IMPORT" },
      null,
      { runtimeEnabled: true, userOptIn: true },
    )).rejects.toBeInstanceOf(AiAssistanceUnavailableError);
  });

  it("sends only cleaned minimum merchant context and never an amount", async () => {
    const enrich = vi.fn(async (_input: EnrichmentInput) => ({
      merchantName: "Red Rooster",
      categoryKey: "coffee-takeaway",
    }));
    const result = await suggestMerchantWithOptionalEnrichment(
      createTestUserContext("user_2"),
      {
        cleanedMerchant: "RED ROOSTER",
        direction: "MONEY_OUT",
        institutionCode: "AU00000",
        accountType: "transaction",
      },
      null,
      { enrich },
      { runtimeEnabled: true, enhancedLookupOptIn: true },
    );

    expect(enrich).toHaveBeenCalledWith({
      cleanedMerchant: "RED ROOSTER",
      country: "AU",
      institutionCode: "AU00000",
      accountType: "transaction",
    });
    expect(JSON.stringify(enrich.mock.calls)).not.toContain("amount");
    expect(result).toMatchObject({
      type: "SUGGESTION",
      source: "OPTIONAL_ENRICHMENT",
      userConfirmationRequired: true,
    });
  });

  it("rejects merchant text that still resembles private identifiers", async () => {
    const enrich = vi.fn(async (_input: EnrichmentInput) => ({}));
    await expect(suggestMerchantWithOptionalEnrichment(
      createTestUserContext("user_2"),
      {
        cleanedMerchant: "CARD 12345678 RED ROOSTER",
        direction: "MONEY_OUT",
        institutionCode: "AU00000",
      },
      null,
      { enrich },
      { runtimeEnabled: true, enhancedLookupOptIn: true },
    )).rejects.toBeTruthy();
    expect(enrich).not.toHaveBeenCalled();
  });

  it("keeps transfer review local rather than asking enrichment to decide direction", async () => {
    const enrich = vi.fn(async (_input: EnrichmentInput) => ({}));
    const result = await suggestMerchantWithOptionalEnrichment(
      createTestUserContext("user_2"),
      {
        cleanedMerchant: "TRANSFER PURPOSE",
        direction: "TRANSFER",
        institutionCode: "AU00000",
      },
      null,
      { enrich },
      { runtimeEnabled: true, enhancedLookupOptIn: true },
    );
    expect(result).toEqual({
      type: "NO_SUGGESTION",
      reason: "TRANSFER_REQUIRES_LOCAL_REVIEW",
    });
    expect(enrich).not.toHaveBeenCalled();
  });

  it("passes only a bounded structured AI request after explicit opt-in", async () => {
    const assist = vi.fn(async (_input: unknown) => ({
      summary: "Review the suggested category.",
      suggestedCategoryKey: "coffee-takeaway",
    }));
    const result = await requestOptionalAiAssistance(
      createTestUserContext("user_3"),
      {
        mode: "CATEGORISE",
        direction: "MONEY_OUT",
        cleanedMerchant: "RED ROOSTER",
        categories: [{ key: "account-fees", label: "Account fees" }],
      },
      { assist },
      { runtimeEnabled: true, userOptIn: true },
    );

    expect(assist).toHaveBeenCalledWith({
      mode: "CATEGORISE",
      direction: "MONEY_OUT",
      cleanedMerchant: "RED ROOSTER",
      categories: [{ key: "account-fees", label: "Account fees" }],
    });
    expect(result).toMatchObject({
      type: "ASSISTANCE",
      readOnly: true,
      userConfirmationRequired: true,
    });
  });

  it("accepts only an allowlisted read-only search plan", async () => {
    const assist = vi.fn(async (_input: unknown) => ({
      summary: "Here is the category breakdown.",
      searchPlan: {
        intent: "CATEGORY_BREAKDOWN",
        month: "2026-07",
        categoryKey: null,
        direction: "MONEY_OUT",
      },
    }));
    const result = await requestOptionalAiAssistance(
      createTestUserContext("user_4"),
      {
        mode: "SEARCH",
        intent: "CATEGORY_BREAKDOWN",
        month: "2026-07",
        categoryKey: null,
        direction: "MONEY_OUT",
      },
      { assist },
      { runtimeEnabled: true, userOptIn: true },
    );
    expect(result).toMatchObject({ type: "ASSISTANCE", readOnly: true });
    expect(JSON.stringify(assist.mock.calls)).not.toMatch(/sql|database|rawQuery/i);
  });

  it("rejects unbounded provider output rather than executing it", async () => {
    const result = await requestOptionalAiAssistance(
      createTestUserContext("user_4"),
      { mode: "HELP", topic: "PRIVACY" },
      { async assist() { return { summary: "x".repeat(1000), sql: "DELETE FROM Transaction" }; } },
      { runtimeEnabled: true, userOptIn: true },
    );
    expect(result).toEqual({
      type: "NO_SUGGESTION",
      reason: "PROVIDER_RESULT_UNUSABLE",
    });
  });

  it("contains no persistence, provider SDK, raw banking payload fields or logging", async () => {
    const [merchant, ai] = await Promise.all([
      readFile(merchantPath, "utf8"),
      readFile(aiPath, "utf8"),
    ]);
    const source = merchant + ai;
    expect(source).not.toContain("@prisma/client");
    expect(source).not.toContain("@/src/server/db");
    expect(source).not.toMatch(/console\.(?:log|info|warn|error)/);
    expect(source).not.toContain("rawCsv");
    expect(source).not.toContain("rawNarration");
    expect(source).not.toContain("accountNumber");
    expect(source).not.toContain("balanceCents");
    expect(source).not.toContain("amountCents");
    expect(source).not.toContain("filename");
    expect(source).not.toContain("providerPayload");
    expect(source).not.toContain("openai");
  });
});
