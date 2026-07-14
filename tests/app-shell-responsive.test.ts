import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appShellSource = readFileSync("components/app-shell.tsx", "utf8");
const navigationSource = readFileSync("components/bottom-nav.tsx", "utf8");
const globalStyles = readFileSync("app/globals.css", "utf8");
const schemaSource = readFileSync("prisma/schema.prisma", "utf8");

describe("Phase 4 Milestone 4 responsive shell", () => {
  it("uses the approved brand without the old permanent tagline or mode badge", () => {
    expect(appShellSource).toContain('/brand/spendgrove-logo.png');
    expect(appShellSource).toContain('/icon.svg');
    expect(appShellSource).toContain('alt="SpendGrove"');
    expect(appShellSource).not.toContain("Your money, simply");
    expect(appShellSource).not.toContain("ModeBadge");
    expect(appShellSource).not.toContain("Advanced preference");
  });

  it("keeps exactly the five approved primary destinations", () => {
    const labels = [...navigationSource.matchAll(/label: "([^"]+)"/g)].map((match) => match[1]);

    expect(labels).toEqual(["Home", "Transactions", "Loans", "Import", "Settings"]);
    expect(new Set(labels).size).toBe(5);
  });

  it("uses viewport-appropriate navigation with an active route state", () => {
    expect(navigationSource).toContain("aria-current");
    expect(navigationSource).toContain("lg:hidden");
    expect(appShellSource).toContain("lg:flex");
    expect(appShellSource).toContain("lg:grid-cols-[15.5rem_minmax(0,1fr)]");
    expect(navigationSource).toContain("bg-brand-evergreen text-white");
  });

  it("keeps mobile content clear of the safe-area navigation", () => {
    expect(appShellSource).toContain("env(safe-area-inset-bottom)");
    expect(navigationSource).toContain("pb-[env(safe-area-inset-bottom)]");
    expect(appShellSource).toContain('id="main-content"');
    expect(appShellSource).toContain("Skip to content");
  });

  it("uses a neutral canvas and reduced-motion support", () => {
    expect(globalStyles).toContain("background: hsl(var(--background))");
    expect(globalStyles).not.toContain("radial-gradient");
    expect(globalStyles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globalStyles).toContain(":focus-visible");
  });

  it("does not introduce a schema foundation for the visual overhaul", () => {
    expect(schemaSource).not.toContain("UiPreference");
    expect(schemaSource).not.toContain("NavigationPreference");
    expect(schemaSource).not.toContain("VisualTheme");
  });
});
