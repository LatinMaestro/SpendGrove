export const PHASE_10_COLLABORATION_RUNTIME_ENABLED = false as const;

export function requirePhase10CollaborationRuntime() {
  if (!PHASE_10_COLLABORATION_RUNTIME_ENABLED) {
    throw new Error("PHASE_10_COLLABORATION_NOT_AVAILABLE");
  }
}
