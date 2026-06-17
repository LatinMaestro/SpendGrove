import { describe, expect, it } from "vitest";
import {
  assertServerOnlyCurrentUser,
  CurrentUserAuthenticationError,
  getClerkIdentity,
  getCurrentUserContext,
  isClerkBackedUserContext,
} from "@/src/server/auth/current-user";
import type { UserProvisioningStore } from "@/src/server/auth/user-provisioning";

const CLERK_ENV = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_SYNTHETIC",
  CLERK_SECRET_KEY: "sk_test_SYNTHETIC",
};

function createMemoryStore(): UserProvisioningStore & { createdCount: () => number } {
  const users = new Map<string, {
    id: string;
    authProvider: "CLERK";
    authProviderUserId: string;
    email?: string | null;
    name?: string | null;
  }>();
  let created = 0;

  return {
    async findByProviderIdentity(identity) {
      return users.get(identity.providerUserId) ?? null;
    },
    async createUserWithSettings(identity) {
      created += 1;
      const user = {
        id: `user_${created}`,
        authProvider: "CLERK" as const,
        authProviderUserId: identity.providerUserId,
        email: identity.email,
        name: identity.name,
      };
      users.set(identity.providerUserId, user);
      return user;
    },
    createdCount() {
      return created;
    },
  };
}

describe("Clerk-backed server current-user context", () => {
  it("maps Clerk identity into a safe SpendGrove identity payload", async () => {
    await expect(getClerkIdentity({
      env: CLERK_ENV,
      loadAuth: () => ({ userId: "clerk_user_123" }),
      loadUser: () => ({
        fullName: "River Gum",
        primaryEmailAddress: { emailAddress: "river@example.test" },
      }),
    })).resolves.toEqual({
      providerUserId: "clerk_user_123",
      email: "river@example.test",
      name: "River Gum",
    });
  });

  it("rejects missing Clerk sessions", async () => {
    await expect(getClerkIdentity({
      env: CLERK_ENV,
      loadAuth: () => ({ userId: null }),
      loadUser: () => null,
    })).rejects.toThrow(CurrentUserAuthenticationError);
  });

  it("lazily creates a user once and reuses the mapped user on repeated access", async () => {
    const store = createMemoryStore();
    const options = {
      env: CLERK_ENV,
      loadAuth: () => ({ userId: "clerk_user_123" }),
      loadUser: () => ({
        firstName: "River",
        lastName: "Gum",
        primaryEmailAddress: { emailAddress: "river@example.test" },
      }),
      store,
    };

    const firstContext = await getCurrentUserContext(options);
    const secondContext = await getCurrentUserContext(options);

    expect(firstContext).toEqual(secondContext);
    expect(firstContext).toMatchObject({
      userId: "user_1",
      provider: "clerk",
      providerUserId: "clerk_user_123",
      isStub: false,
    });
    expect(isClerkBackedUserContext(firstContext)).toBe(true);
    expect(store.createdCount()).toBe(1);
  });

  it("rejects browser runtime resolution", () => {
    expect(() => assertServerOnlyCurrentUser({ hasWindow: true })).toThrow(/server-only/i);
  });

  it("does not expose the old Phase 3A stub constants from production current-user code", async () => {
    const source = await import("node:fs/promises").then((fs) => fs.readFile("src/server/auth/current-user.ts", "utf8"));

    expect(source).not.toContain("phase3a_stub_user");
    expect(source).not.toContain("createPhase3aStubUserContext");
  });
});
