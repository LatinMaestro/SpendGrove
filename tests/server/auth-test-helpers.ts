import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";

export function createTestUserContext(userId = "test_user") : AuthenticatedUserContext {
  return {
    userId,
    provider: "clerk",
    providerUserId: `clerk_${userId}`,
    isStub: false,
  };
}
