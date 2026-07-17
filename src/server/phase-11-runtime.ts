export const PHASE_11_DOCUMENTS_RUNTIME_ENABLED = false as const;

export function requirePhase11DocumentsRuntime() {
  if (!PHASE_11_DOCUMENTS_RUNTIME_ENABLED) {
    throw new Error("PHASE_11_DOCUMENTS_NOT_AVAILABLE");
  }
}
