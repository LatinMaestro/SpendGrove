import { describe, expect, it } from "vitest";
import {
  assertUserOwnsRecord,
  assertUserScopedWhere,
  AuthenticationRequiredError,
  createUserScopedWhere,
  OwnershipError,
  requireAuthenticatedUserContext,
} from "@/src/server/auth/ownership";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

describe("server ownership helpers", () => {
  const user = createTestUserContext("user_1");

  it("requires authenticated user context before server data access", () => {
    expect(() => requireAuthenticatedUserContext(null)).toThrow(AuthenticationRequiredError);
    expect(requireAuthenticatedUserContext(user)).toBe(user);
  });

  it("accepts user-owned records for the current user", () => {
    expect(() => assertUserOwnsRecord(user, { userId: user.userId }, "transaction")).not.toThrow();
  });

  it("rejects missing or mismatched user ownership", () => {
    expect(() => assertUserOwnsRecord(user, { userId: undefined }, "transaction")).toThrow(OwnershipError);
    expect(() => assertUserOwnsRecord(user, { userId: "another_user" }, "transaction")).toThrow(OwnershipError);
  });

  it("adds authenticated user scope to future query filters", () => {
    expect(createUserScopedWhere(user, { status: "ACTIVE" })).toEqual({
      status: "ACTIVE",
      userId: user.userId,
    });
  });

  it("rejects client-supplied mismatched userId values", () => {
    expect(() => createUserScopedWhere(user, { userId: "client_supplied_user" })).toThrow(OwnershipError);
    expect(() => assertUserScopedWhere(user, { userId: "client_supplied_user" })).toThrow(OwnershipError);
  });

  it("requires future query filters to carry the authenticated user scope", () => {
    expect(() => assertUserScopedWhere(user, { userId: user.userId })).not.toThrow();
    expect(() => assertUserScopedWhere(user, { status: "ACTIVE" })).toThrow(OwnershipError);
  });
});
