import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { everydayBankFormatRegister } from "@/lib/csv-bank-profiles";

const helpPath = new URL("../app/help/page.tsx", import.meta.url);
const importPath = new URL("../components/csv-import-foundation.tsx", import.meta.url);

describe("Phase 7 supported-bank guidance", () => {
  it("derives public support lists from the typed registry", () => {
    const confirmed = everydayBankFormatRegister.filter((entry) => entry.supportStatus === "CONFIRMED_PROFILE");
    const genericOnly = everydayBankFormatRegister.filter((entry) => entry.supportStatus === "GENERIC_ONLY");

    expect(confirmed.map((entry) => entry.bankName)).toEqual([
      "Commonwealth Bank",
      "ANZ",
      "NAB",
      "Westpac",
    ]);
    expect(genericOnly).toHaveLength(15);
  });

  it("labels generic-only targets as checked manual mapping rather than automatic support", async () => {
    const help = await readFile(helpPath, "utf8");

    expect(help).toContain('id="supported-bank-formats"');
    expect(help).toContain('entry.supportStatus === "CONFIRMED_PROFILE"');
    expect(help).toContain('entry.supportStatus === "GENERIC_ONLY"');
    expect(help).toContain("These are target banks, not confirmed automatic formats");
    expect(help).toContain("Banks currently using checked manual mapping");
    expect(help).not.toContain("All supported Australian banks");
  });

  it("keeps safe format guidance reachable from the upload and mapping steps", async () => {
    const source = await readFile(importPath, "utf8");

    expect(source).toContain('href="/help#supported-bank-formats"');
    expect(source).toContain("See supported banks and CSV guidance");
    expect(source).toContain("Check this bank or custom format");
    expect(source).toContain("Known format:");
    expect(source).not.toContain("filename");
  });
});
