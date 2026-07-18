import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  COMMERCIAL_CAPABILITY_KEYS,
  COMMERCIAL_PLAN_NAMES,
  canUseCommercialCapability,
  getCurrentCommercialEntitlements,
  isSafetyCriticalCapability,
} from "@/src/server/commercial-entitlements";
import { PHASE_14_COMMERCIAL_ENTITLEMENTS_RUNTIME_ENABLED } from "@/src/server/phase-14-runtime";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const entitlementPath = new URL("../../src/server/commercial-entitlements.ts", import.meta.url);
const runtimePath = new URL("../../src/server/phase-14-runtime.ts", import.meta.url);

describe("Phase 14 inactive commercial entitlement boundary", () => {
  it("keeps the commercial runtime hard disabled", () => {
    expect(PHASE_14_COMMERCIAL_ENTITLEMENTS_RUNTIME_ENABLED).toBe(false);
  });

  it("reserves plan names without assigning a plan", () => {
    expect(COMMERCIAL_PLAN_NAMES).toEqual(["FREE", "PLUS", "PRO", "HOUSEHOLD"]);
    expect(getCurrentCommercialEntitlements(createTestUserContext("user_1"))).toMatchObject({
      commercialRuntimeEnabled: false,
      commercialStatus: "NOT_CONFIGURED",
      plan: null,
      commercialRestrictionsApplied: false,
    });
  });

  it("preserves every currently accepted baseline capability", () => {
    const context = createTestUserContext("user_1");
    for (const capability of [
      "CORE_TRANSACTIONS",
      "MANUAL_ENTRY",
      "CSV_IMPORT",
      "SAVED_IMPORT_PROFILES",
      "BUDGETS",
      "REGULAR_PAYMENTS",
      "LOANS_AND_PROPERTIES",
      "REPORTS_AND_EXPORTS",
      "ACCOUNT_EXPORT",
      "ACCOUNT_DELETION",
      "FINANCIAL_CORRECTIONS",
      "PRIVACY_AND_SECURITY_CONTROLS",
    ] as const) {
      expect(canUseCommercialCapability(context, capability)).toBe(true);
    }
  });

  it("reports guarded future capabilities as unavailable rather than commercially restricted", () => {
    const snapshot = getCurrentCommercialEntitlements(createTestUserContext("user_2"));
    const unavailable = snapshot.capabilities.filter(
      (capability) => capability.status === "UNAVAILABLE_RUNTIME",
    );
    expect(unavailable.map((capability) => capability.key)).toEqual([
      "BULK_OPERATIONS",
      "DURABLE_TRANSFER_LINKING",
      "IMPORT_UNDO",
      "ADVANCED_PERSONAL_FINANCE",
      "HOUSEHOLD_COLLABORATION",
      "ACCOUNTANT_ACCESS",
      "DOCUMENT_STORAGE",
      "OPTIONAL_MERCHANT_ENRICHMENT",
      "OPTIONAL_AI_ASSISTANCE",
      "NATIVE_DEVICE_FEATURES",
    ]);
    expect(unavailable.every((capability) => capability.commerciallyRestricted === false)).toBe(true);
  });

  it("never commercialises export, deletion, corrections or privacy controls", () => {
    for (const capability of COMMERCIAL_CAPABILITY_KEYS) {
      if (isSafetyCriticalCapability(capability)) {
        expect(canUseCommercialCapability(
          createTestUserContext("user_3"),
          capability,
        )).toBe(true);
      }
    }
  });

  it("represents every numeric limit as undecided", () => {
    const { limits } = getCurrentCommercialEntitlements(createTestUserContext("user_4"));
    expect(Object.values(limits)).toEqual([
      "UNDECIDED",
      "UNDECIDED",
      "UNDECIDED",
      "UNDECIDED",
      "UNDECIDED",
      "UNDECIDED",
      "UNDECIDED",
    ]);
  });

  it("requires an authenticated account and accepts no client plan input", () => {
    expect(() => getCurrentCommercialEntitlements(null)).toThrow();
    expect(getCurrentCommercialEntitlements).toHaveLength(1);
  });

  it("returns an immutable shared baseline", () => {
    const snapshot = getCurrentCommercialEntitlements(createTestUserContext("user_5"));
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.capabilities)).toBe(true);
    expect(snapshot.capabilities.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(snapshot.limits)).toBe(true);
  });

  it("contains no provider, persistence, price, checkout or private finance payload", async () => {
    const [entitlements, runtime] = await Promise.all([
      readFile(entitlementPath, "utf8"),
      readFile(runtimePath, "utf8"),
    ]);
    const source = entitlements + runtime;
    expect(source).not.toContain("@prisma/client");
    expect(source).not.toContain("@/src/server/db");
    expect(source).not.toMatch(/\b(?:stripe|storekit|checkout|webhook|receipt)\b/i);
    expect(source).not.toMatch(/\bprice(?:Cents)?\b/i);
    expect(source).not.toContain("amountCents");
    expect(source).not.toContain("balanceCents");
    expect(source).not.toContain("rawCsv");
    expect(source).not.toContain("rawNarration");
    expect(source).not.toContain("accountNumber");
    expect(source).not.toContain("email");
    expect(source).not.toMatch(/console\.(?:log|info|warn|error)/);
  });
});
