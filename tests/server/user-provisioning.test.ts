import { describe, expect, it } from "vitest";
import {
  createPrismaUserProvisioningStore,
  findOrCreateUserForClerkIdentity,
  MissingClerkIdentityError,
} from "@/src/server/auth/user-provisioning";

describe("Clerk lazy user provisioning", () => {
  it("reuses an existing provider-mapped user", async () => {
    let createCalls = 0;
    const existingUser = {
      id: "user_existing",
      authProvider: "CLERK" as const,
      authProviderUserId: "clerk_existing",
      email: "existing@example.test",
      name: "Existing User",
    };

    const user = await findOrCreateUserForClerkIdentity({ providerUserId: "clerk_existing" }, {
      async findByProviderIdentity() {
        return existingUser;
      },
      async createUserWithSettings() {
        createCalls += 1;
        return existingUser;
      },
    });

    expect(user).toBe(existingUser);
    expect(createCalls).toBe(0);
  });

  it("creates a mapped User and UserSettings together when no user exists", async () => {
    const calls: Array<{ type: string; payload: unknown }> = [];
    const prisma = {
      user: {
        async findUnique() {
          return null;
        },
      },
      async $transaction(callback: (transaction: unknown) => Promise<unknown>) {
        return callback({
          user: {
            async upsert(payload: unknown) {
              calls.push({ type: "user.upsert", payload });
              return {
                id: "user_created",
                authProvider: "CLERK",
                authProviderUserId: "clerk_created",
                email: "river@example.test",
                name: "River Gum",
              };
            },
          },
          userSettings: {
            async upsert(payload: unknown) {
              calls.push({ type: "userSettings.upsert", payload });
              return { id: "settings_created", userId: "user_created" };
            },
          },
        });
      },
    };

    const store = createPrismaUserProvisioningStore(prisma as never);
    const user = await findOrCreateUserForClerkIdentity({
      providerUserId: "clerk_created",
      email: " river@example.test ",
      name: " River Gum ",
    }, store);

    expect(user).toMatchObject({
      id: "user_created",
      authProviderUserId: "clerk_created",
    });
    expect(calls.map((call) => call.type)).toEqual(["user.upsert", "userSettings.upsert"]);
    expect(JSON.stringify(calls)).toContain("settings");
    expect(JSON.stringify(calls)).toContain("user_created");
  });

  it("rejects missing Clerk provider IDs before provisioning", async () => {
    await expect(findOrCreateUserForClerkIdentity({ providerUserId: "" }, {
      async findByProviderIdentity() {
        throw new Error("should not be called");
      },
      async createUserWithSettings() {
        throw new Error("should not be called");
      },
    })).rejects.toThrow(MissingClerkIdentityError);
  });
});
