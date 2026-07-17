export const PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED = false as const;

export function requirePhase9AdvancedFinanceRuntime() {
  if (!PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED) {
    throw new Error("PHASE_9_ADVANCED_FINANCE_NOT_AVAILABLE");
  }
}
