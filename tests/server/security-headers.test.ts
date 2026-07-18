import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Phase 5 browser security baseline", () => {
  it("declares the approved browser response headers and hides the framework header", async () => {
    const source = await readFile("next.config.mjs", "utf8");

    expect(source).toContain("poweredByHeader: false");
    expect(source).toContain('"Strict-Transport-Security"');
    expect(source).toContain('"max-age=63072000"');
    expect(source).toContain('"X-Frame-Options"');
    expect(source).toContain('"DENY"');
    expect(source).toContain('"X-Content-Type-Options"');
    expect(source).toContain('"nosniff"');
    expect(source).toContain('"Referrer-Policy"');
    expect(source).toContain('"strict-origin-when-cross-origin"');
    expect(source).toContain('"Permissions-Policy"');
    expect(source).toContain('"Cross-Origin-Opener-Policy"');
    expect(source).toContain('"X-Permitted-Cross-Domain-Policies"');
  });

  it("keeps every pre-release route out of search indexes until launch approval", async () => {
    const source = await readFile("next.config.mjs", "utf8");

    expect(source).toContain('source: "/:path*"');
    expect(source).toContain('"X-Robots-Tag"');
    expect(source).toContain('"noindex, nofollow, noarchive"');
    expect(source).toContain("client-approved public-launch");
  });

  it("uses Clerk strict CSP with the required restrictive directives", async () => {
    const source = await readFile("middleware.ts", "utf8");
    const provider = await readFile("components/auth/clerk-app-provider.tsx", "utf8");

    expect(source).toContain("contentSecurityPolicy");
    expect(source).toContain("strict: true");
    expect(source).toContain('"frame-ancestors": ["\'none\'"]');
    expect(source).toContain('"object-src": ["\'none\'"]');
    expect(source).toContain('"/__clerk/(.*)"');
    expect(provider).toContain("<ClerkProvider");
    expect(provider).toContain("dynamic");
  });

  it("marks authenticated finance responses and unauthenticated failures private and non-cacheable", async () => {
    const source = await readFile("middleware.ts", "utf8");

    expect(source).toContain('private, no-store, max-age=0');
    expect(source).toContain('response.headers.set("Pragma", "no-cache")');
    expect(source).toContain('response.headers.set("Expires", "0")');
    expect(source.match(/protectPrivateResponse\(/g)?.length).toBeGreaterThanOrEqual(4);
  });
});
