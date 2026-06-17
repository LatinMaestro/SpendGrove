import { describe, expect, it } from "vitest";
import {
  assertServerOnlyCurrentUser,
  createPhase3aStubUserContext,
  getCurrentUserContext,
  PHASE_3A_STUB_PROVIDER_USER_ID,
  PHASE_3A_STUB_USER_ID,
} from "@/src/server/auth/current-user";

describe("temporary server current-user context", () => {
  it("returns an obvious Phase 3A stub user until Clerk replaces it", async () => {
    await expect(getCurrentUserContext()).resolves.toEqual({
      userId: PHASE_3A_STUB_USER_ID,
      provider: "phase3a_stub",
      providerUserId: PHASE_3A_STUB_PROVIDER_USER_ID,
      isStub: true,
    });
  });

  it("creates the same stub context without reading client-supplied data", () => {
    expect(createPhase3aStubUserContext()).toMatchObject({
      userId: "phase3a_stub_user",
      provider: "phase3a_stub",
      isStub: true,
    });
  });

  it("rejects browser runtime resolution", () => {
    expect(() => assertServerOnlyCurrentUser({ hasWindow: true })).toThrow(/server-only/i);
  });
});
