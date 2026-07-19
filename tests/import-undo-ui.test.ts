import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const pagePath = new URL("../app/import/page.tsx", import.meta.url);
const centrePath = new URL("../components/import-centre.tsx", import.meta.url);
const historyPath = new URL("../components/account-import-history-panel.tsx", import.meta.url);
const controlsPath = new URL("../components/import-undo-controls.tsx", import.meta.url);
const undoRoutePath = new URL("../app/api/account/import-history/[batchId]/undo/route.ts", import.meta.url);
const restoreRoutePath = new URL("../app/api/account/import-history/[batchId]/restore/route.ts", import.meta.url);
const statusRoutePath = new URL("../app/api/account/import-history/[batchId]/undo-status/route.ts", import.meta.url);

describe("Preview import recovery UI", () => {
  it("renders controls only behind the verified Preview capability", async () => {
    const [page, centre, history] = await Promise.all([
      readFile(pagePath, "utf8"),
      readFile(centrePath, "utf8"),
      readFile(historyPath, "utf8"),
    ]);
    expect(page).toContain("isVerifiedPreviewRuntime()");
    expect(page).toContain("importUndoAvailable=");
    expect(centre).toContain("importUndoAvailable");
    expect(history).toContain("importUndoAvailable && <ImportUndoControls");
  });

  it("requires explicit confirmation and preserves Skip and Merge outcomes", async () => {
    const controls = await readFile(controlsPath, "utf8");
    expect(controls).toContain("Undo import");
    expect(controls).toContain("Restore import");
    expect(controls).toContain("UNDO IMPORT");
    expect(controls).toContain("RESTORE IMPORT");
    expect(controls).toContain("Skipped and merged rows will not change");
    expect(controls).toContain("Confirm undo");
    expect(controls).toContain("Confirm restore");
    expect(controls).toContain("Cancel");
    expect(controls).not.toMatch(/description|merchant|amount|filename|account reference|bsb/i);
  });

  it("keeps status, undo and restore behind owner-scoped server routes", async () => {
    const [undo, restore, status] = await Promise.all([
      readFile(undoRoutePath, "utf8"),
      readFile(restoreRoutePath, "utf8"),
      readFile(statusRoutePath, "utf8"),
    ]);
    for (const route of [undo, restore, status]) {
      expect(route).toContain("getCurrentUserContext()");
      expect(route).toContain("(await params).batchId");
      expect(route).toContain('export const dynamic = "force-dynamic"');
    }
  });

  it("uses accessible labelled controls and no new navigation destination", async () => {
    const [controls, centre] = await Promise.all([
      readFile(controlsPath, "utf8"),
      readFile(centrePath, "utf8"),
    ]);
    expect(controls).toContain("<label");
    expect(controls).toContain('role="alert"');
    expect(controls).toContain('type="button"');
    expect(centre).toContain('id: "HISTORY"');
    expect(centre).not.toMatch(/UNDO|RECOVERY/);
  });
});
