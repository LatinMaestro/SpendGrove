import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const helpPath = new URL("../app/help/page.tsx", import.meta.url);
const shellPath = new URL("../components/public-information-shell.tsx", import.meta.url);
const settingsPath = new URL("../components/settings-panel.tsx", import.meta.url);
const guidePath = new URL("../docs/PHASE_5_SAFE_SUPPORT_GUIDE.md", import.meta.url);
const csvPath = new URL("../lib/csv-import.ts", import.meta.url);

describe("Phase 5 help and safe support", () => {
  it("documents the implemented CSV limits and review flow", async () => {
    const [help, csv] = await Promise.all([
      readFile(helpPath, "utf8"),
      readFile(csvPath, "utf8"),
    ]);
    expect(csv).toContain("MAX_CSV_FILE_SIZE_BYTES = 5 * 1024 * 1024");
    expect(csv).toContain("MAX_CSV_ROWS = 5000");
    expect(help).toContain("5 MB and 5,000 rows");
    expect(help).toContain("Import, Skip or Merge");
    expect(help).toContain("Review every row");
  });

  it("warns users not to send real financial files or screenshots", async () => {
    const [help, guide] = await Promise.all([
      readFile(helpPath, "utf8"),
      readFile(guidePath, "utf8"),
    ]);
    expect(help).toContain("Do not send anyone your real CSV file");
    expect(help).toContain("use synthetic data");
    expect(help).toContain("Never attach a real CSV");
    expect(guide).toContain("Never request a real bank CSV");
    expect(guide).toContain("synthetic file");
  });

  it("covers account/local-data, export, deletion and private-beta limitations", async () => {
    const help = await readFile(helpPath, "utf8");
    expect(help).toContain("remains separate");
    expect(help).toContain("versioned JSON account export");
    expect(help).toContain("permanent account deletion");
    expect(help).toContain("No live bank connection");
    expect(help).toContain("No AI advice");
    expect(help).toContain("No tax lodgement");
    expect(help).toContain("No native iOS");
  });

  it("keeps support provider-free and uses the central unresolved contact", async () => {
    const [help, guide] = await Promise.all([
      readFile(helpPath, "utf8"),
      readFile(guidePath, "utf8"),
    ]);
    expect(help).toContain("RELEASE_CONTACT_PLACEHOLDER");
    expect(help).toContain("No support-ticket provider");
    expect(guide).toContain("no support-ticket provider");
    expect(help + guide).not.toMatch(/mailto:|support@|privacy@|zendesk|intercom|freshdesk/i);
    expect(help).not.toMatch(/fetch\(|<form|type="file"|chatbot/i);
  });

  it("makes Help discoverable without adding a finance-navigation destination", async () => {
    const [shell, settings] = await Promise.all([
      readFile(shellPath, "utf8"),
      readFile(settingsPath, "utf8"),
    ]);
    expect(shell).toContain('href="/help"');
    expect(settings).toContain('href="/help"');
    expect(settings).toContain("Open SpendGrove help");
  });
});
