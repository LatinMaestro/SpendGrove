import { describe, expect, it } from "vitest";
import {
  isProtectedApiPath,
  isProtectedPath,
  isPublicAppPath,
  sanitizeInternalReturnPath,
} from "@/src/server/auth/route-policy";

describe("private-beta route policy", () => {
  it("keeps only release information, onboarding and authentication surfaces public", () => {
    expect(isPublicAppPath("/help")).toBe(true);
    expect(isPublicAppPath("/onboarding")).toBe(true);
    expect(isPublicAppPath("/privacy")).toBe(true);
    expect(isPublicAppPath("/sign-in")).toBe(true);
    expect(isPublicAppPath("/sign-in/verify")).toBe(true);
    expect(isPublicAppPath("/sign-up")).toBe(true);

    expect(isPublicAppPath("/")).toBe(false);
    expect(isPublicAppPath("/transactions")).toBe(false);
    expect(isPublicAppPath("/import")).toBe(false);
    expect(isPublicAppPath("/loans")).toBe(false);
    expect(isPublicAppPath("/settings")).toBe(false);
  });

  it("protects every operational finance route", () => {
    for (const pathname of [
      "/",
      "/transactions",
      "/import",
      "/loans",
      "/loans/import",
      "/settings",
      "/budgets",
      "/regular-payments",
      "/account",
    ]) {
      expect(isProtectedPath(pathname), pathname).toBe(true);
    }
  });

  it("protects durable account and server APIs", () => {
    expect(isProtectedApiPath("/api/account/transactions")).toBe(true);
    expect(isProtectedApiPath("/api/server/example")).toBe(true);
    expect(isProtectedPath("/api/account/transactions")).toBe(true);
    expect(isProtectedPath("/api/server/example")).toBe(true);
  });

  it("accepts only same-origin return paths", () => {
    expect(sanitizeInternalReturnPath("/transactions?month=2026-07")).toBe("/transactions?month=2026-07");
    expect(sanitizeInternalReturnPath("https://example.com")).toBe("/");
    expect(sanitizeInternalReturnPath("//example.com/path")).toBe("/");
    expect(sanitizeInternalReturnPath("\\example.com")).toBe("/");
    expect(sanitizeInternalReturnPath("/sign-in?redirect_url=/loans")).toBe("/");
  });
});
