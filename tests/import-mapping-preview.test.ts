import { describe, expect, it } from "vitest";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";
import {
  createImportMappingPreview,
  IMPORT_MAPPING_PREVIEW_LIMIT,
} from "@/lib/import-mapping-preview";
import { getManualCategory } from "@/lib/manual-categories";

function categoryName(categoryId: string) {
  return getManualCategory(categoryId)?.name;
}

describe("import mapping preview", () => {
  it("shows at most three safe mapped transaction examples", () => {
    const document = parseCsvDocument([
      "01/06/2026,-18.50,Woolworths terminal 76543210 card xx4321",
      "02/06/2026,-5.25,Translink go card reference 987654321",
      "03/06/2026,-50.00,OSKO transfer to Fictional Person account 12345678",
      "04/06/2026,-9.90,Coles Fictional Suburb",
    ].join("\n"));
    const scan = scanCsvDocument(document, {
      0: "DATE",
      1: "AMOUNT",
      2: "DESCRIPTION",
    });

    const preview = createImportMappingPreview(document, scan.columns, scan.mapping);
    const serialized = JSON.stringify(preview);

    expect(preview).toHaveLength(IMPORT_MAPPING_PREVIEW_LIMIT);
    expect(preview.map((row) => row.merchantName)).toEqual([
      "Woolworths",
      "Translink",
      "Bank transfer",
    ]);
    expect(preview.map((row) => categoryName(row.categoryId))).toEqual([
      "Groceries",
      "Public transport",
      "Transfer",
    ]);
    expect(serialized).not.toContain("76543210");
    expect(serialized).not.toContain("4321");
    expect(serialized).not.toContain("987654321");
    expect(serialized).not.toContain("Fictional Person");
    expect(serialized).not.toContain("12345678");
  });

  it("requires completed mappings before examples can be created", () => {
    const document = parseCsvDocument("01/06/2026,-18.50,Fictional Grocer");
    const scan = scanCsvDocument(document, {
      0: "DATE",
      1: "IGNORE",
      2: "DESCRIPTION",
    });

    expect(() => createImportMappingPreview(document, scan.columns, scan.mapping)).toThrow(
      "Complete the required column mapping before reviewing rows.",
    );
  });
});
