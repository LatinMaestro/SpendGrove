import { describe, expect, it } from "vitest";
import { isProtectedPath, isPublicPrototypePath } from "@/src/server/auth/route-policy";

describe("Clerk route policy", () => {
  it("keeps existing browser-local prototype routes public", () => {
    expect(isPublicPrototypePath("/")).toBe(true);
    expect(isPublicPrototypePath("/transactions")).toBe(true);
    expect(isPublicPrototypePath("/import")).toBe(true);
    expect(isPublicPrototypePath("/loans")).toBe(true);
    expect(isPublicPrototypePath("/settings")).toBe(true);
    expect(isPublicPrototypePath("/sign-in")).toBe(true);
    expect(isPublicPrototypePath("/sign-up")).toBe(true);
  });

  it("protects future account/server-owned routes", () => {
    expect(isProtectedPath("/account")).toBe(true);
    expect(isProtectedPath("/account/profile")).toBe(true);
    expect(isProtectedPath("/api/account/user")).toBe(true);
    expect(isProtectedPath("/api/server/transactions")).toBe(true);
  });

  it("does not protect existing browser-local routes yet", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/transactions")).toBe(false);
    expect(isProtectedPath("/import")).toBe(false);
    expect(isProtectedPath("/loans")).toBe(false);
    expect(isProtectedPath("/settings")).toBe(false);
  });
});
