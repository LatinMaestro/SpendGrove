import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { PHASE_14_COMMERCIAL_ENTITLEMENTS_RUNTIME_ENABLED } from "@/src/server/phase-14-runtime";

export const COMMERCIAL_PLAN_NAMES = [
  "FREE",
  "PLUS",
  "PRO",
  "HOUSEHOLD",
] as const;

export type CommercialPlanName = (typeof COMMERCIAL_PLAN_NAMES)[number];

export const COMMERCIAL_CAPABILITY_KEYS = [
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
] as const;

export type CommercialCapabilityKey = (typeof COMMERCIAL_CAPABILITY_KEYS)[number];

type CapabilityState = {
  key: CommercialCapabilityKey;
  status: "AVAILABLE_BASELINE" | "UNAVAILABLE_RUNTIME";
  commerciallyRestricted: false;
};

const BASELINE_AVAILABLE = new Set<CommercialCapabilityKey>([
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
]);

const SAFETY_CRITICAL_CAPABILITIES = new Set<CommercialCapabilityKey>([
  "ACCOUNT_EXPORT",
  "ACCOUNT_DELETION",
  "FINANCIAL_CORRECTIONS",
  "PRIVACY_AND_SECURITY_CONTROLS",
]);

const baselineCapabilities: readonly CapabilityState[] = Object.freeze(
  COMMERCIAL_CAPABILITY_KEYS.map((key) => Object.freeze({
    key,
    status: BASELINE_AVAILABLE.has(key)
      ? "AVAILABLE_BASELINE" as const
      : "UNAVAILABLE_RUNTIME" as const,
    commerciallyRestricted: false as const,
  })),
);

export type CommercialEntitlementSnapshot = {
  commercialRuntimeEnabled: false;
  commercialStatus: "NOT_CONFIGURED";
  plan: null;
  commercialRestrictionsApplied: false;
  capabilities: readonly CapabilityState[];
  limits: {
    importCount: "UNDECIDED";
    bulkOperationSize: "UNDECIDED";
    householdMembers: "UNDECIDED";
    accountantGrants: "UNDECIDED";
    documentStorageBytes: "UNDECIDED";
    optionalEnrichmentRequests: "UNDECIDED";
    optionalAssistanceRequests: "UNDECIDED";
  };
};

const BASELINE_SNAPSHOT: CommercialEntitlementSnapshot = Object.freeze({
  commercialRuntimeEnabled: PHASE_14_COMMERCIAL_ENTITLEMENTS_RUNTIME_ENABLED,
  commercialStatus: "NOT_CONFIGURED",
  plan: null,
  commercialRestrictionsApplied: false,
  capabilities: baselineCapabilities,
  limits: Object.freeze({
    importCount: "UNDECIDED",
    bulkOperationSize: "UNDECIDED",
    householdMembers: "UNDECIDED",
    accountantGrants: "UNDECIDED",
    documentStorageBytes: "UNDECIDED",
    optionalEnrichmentRequests: "UNDECIDED",
    optionalAssistanceRequests: "UNDECIDED",
  }),
});

export function getCurrentCommercialEntitlements(
  context: AuthenticatedUserContext | null | undefined,
): CommercialEntitlementSnapshot {
  requireAuthenticatedUserContext(context);
  return BASELINE_SNAPSHOT;
}

export function canUseCommercialCapability(
  context: AuthenticatedUserContext | null | undefined,
  capability: CommercialCapabilityKey,
): boolean {
  requireAuthenticatedUserContext(context);
  const state = baselineCapabilities.find((entry) => entry.key === capability);
  return state?.status === "AVAILABLE_BASELINE";
}

export function isSafetyCriticalCapability(capability: CommercialCapabilityKey): boolean {
  return SAFETY_CRITICAL_CAPABILITIES.has(capability);
}
