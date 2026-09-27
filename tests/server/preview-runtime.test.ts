import { describe, expect, it } from "vitest";
import { isVerifiedPreviewRuntime } from "@/src/server/preview-runtime";

describe("verified Preview runtime gate", () => {
  it("enables migration-dependent features only in Vercel Preview", () => {
    expect(isVerifiedPreviewRuntime({ VERCEL_ENV: "preview" })).toBe(true);
    expect(isVerifiedPreviewRuntime({ VERCEL_ENV: " PREVIEW " })).toBe(true);
    expect(isVerifiedPreviewRuntime({ VERCEL_ENV: "production" })).toBe(false);
    expect(isVerifiedPreviewRuntime({ VERCEL_ENV: "development" })).toBe(false);
    expect(isVerifiedPreviewRuntime({ NODE_ENV: "development" })).toBe(false);
    expect(isVerifiedPreviewRuntime({})).toBe(false);
  });
});
