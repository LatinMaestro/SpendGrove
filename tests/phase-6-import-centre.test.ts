import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("Phase 6 Import Centre", () => {
  it("keeps Import inside the existing primary destination", async () => {
    const page = await source("app/import/page.tsx");
    const navigation = await source("components/bottom-nav.tsx");

    expect(page).toContain("ImportCentre");
    expect(navigation).toContain('{ href: "/import", label: "Import"');
    expect(navigation.match(/href:/g)).toHaveLength(5);
    expect(navigation).not.toContain("Import Centre");
  });

  it("defaults to a new import and keeps past imports secondary", async () => {
    const centre = await source("components/import-centre.tsx");

    expect(centre).toContain('useState<ImportCentreView>("NEW")');
    expect(centre).toContain('label: "New import"');
    expect(centre).toContain('label: "Past imports"');
    expect(centre).toContain('view === "NEW"');
    expect(centre).toContain("<CsvImportFoundation />");
    expect(centre).toContain("<AccountImportHistoryPanel />");
  });

  it("uses accessible tabs and focused subordinate panels", async () => {
    const centre = await source("components/import-centre.tsx");

    expect(centre).toContain('role="tablist"');
    expect(centre).toContain('aria-label="Import Centre views"');
    expect(centre).toContain('role="tab"');
    expect(centre).toContain("aria-selected={active}");
    expect(centre).toContain('role="tabpanel"');
    expect(centre).toContain("aria-labelledby=");
  });

  it("keeps safe history wording and private source values out of the centre", async () => {
    const centre = await source("components/import-centre.tsx");

    expect(centre).toContain("safe totals and outcomes only");
    expect(centre).toContain("CSV contents, filenames and bank details are not shown");
    expect(centre).not.toContain("account number");
    expect(centre).not.toContain("raw narration");
  });

  it("keeps saved column setups hidden until deliberately opened", async () => {
    const foundation = await source("components/csv-import-foundation.tsx");

    expect(foundation).toContain("<details");
    expect(foundation).toContain("Use or manage a saved column setup");
    expect(foundation).toContain("<SavedImportProfilesPanel");
    expect(foundation).toContain("onApplyScan={applySavedProfile}");
    expect(foundation).toContain("setMappingConfirmed(false)");
  });

  it("does not introduce a desktop-only horizontal scrolling requirement", async () => {
    const centre = await source("components/import-centre.tsx");

    expect(centre).toContain("w-full");
    expect(centre).toContain("sm:grid-cols-2");
    expect(centre).not.toContain("overflow-x-auto");
    expect(centre).not.toContain("min-w-[");
  });
});
