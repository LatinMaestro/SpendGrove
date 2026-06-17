export const PHASE_3A_STUB_USER_ID = "phase3a_stub_user";
export const PHASE_3A_STUB_PROVIDER_USER_ID = "phase3a_stub_provider_user";

export type AuthProvider = "phase3a_stub";

export type AuthenticatedUserContext = {
  userId: string;
  provider: AuthProvider;
  providerUserId: string;
  isStub: boolean;
};

type RuntimeProbe = {
  hasWindow: boolean;
};

export const CURRENT_USER_STUB_WARNING =
  "Temporary Phase 3A stub user context; replace with Clerk identity in PR 3A.2.";

export function assertServerOnlyCurrentUser(runtime: RuntimeProbe = { hasWindow: typeof window !== "undefined" }) {
  if (runtime.hasWindow) {
    throw new Error("Current user context is server-only and must not be resolved in client components.");
  }
}

export function createPhase3aStubUserContext(): AuthenticatedUserContext {
  return {
    userId: PHASE_3A_STUB_USER_ID,
    provider: "phase3a_stub",
    providerUserId: PHASE_3A_STUB_PROVIDER_USER_ID,
    isStub: true,
  };
}

export async function getCurrentUserContext(): Promise<AuthenticatedUserContext> {
  assertServerOnlyCurrentUser();
  return createPhase3aStubUserContext();
}
