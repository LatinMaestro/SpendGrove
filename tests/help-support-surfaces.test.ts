import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const helpPath = new URL("../app/help/page.tsx", import.meta.url);
const shellPath = new URL("../components/public-information-shell.tsx", import.meta.url);
const settingsPath = new URL("../components/settings-panel.tsx", import.meta.url);
const guidePath = new URL("../docs/PHASE_5_SAFE_SUPPORT_GUIDE.md", import.meta.url);
const csvPath = new URL("../lib/csv-import.ts", import.meta.url);
const everydayTemplatePath = new URL("../public/synthetic-everyday-bank-format-template.csv", import.meta.url);
const loanComponentTemplatePath = new URL("../public/synthetic-loan-component-format-template.csv", import.meta.url);
const loanEventTemplatePath = new URL("../public/synthetic-loan-event-format-template.csv", import.meta.url);

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

  it("provides downloadable invented templates without creating a submission channel", async () => {
    const [help, everydayTemplate, loanComponentTemplate, loanEventTemplate] = await Promise.all([
      readFile(helpPath, "utf8"),
      readFile(everydayTemplatePath, "utf8"),
      readFile(loanComponentTemplatePath, "utf8"),
      readFile(loanEventTemplatePath, "utf8"),
    ]);

    expect(help).toContain("Describe an unsupported CSV safely");
    expect(help).toContain("Never use a real CSV or statement for a format example.");
    expect(help).toContain("Rename the remaining placeholder headers");
    expect(help).toContain("Use invented dates, descriptions, amounts and balances only.");
    expect(help).toContain("Keep the synthetic example local");
    expect(help).toContain('href="/synthetic-everyday-bank-format-template.csv" download');
    expect(help).toContain('href="/synthetic-loan-component-format-template.csv" download');
    expect(help).toContain('href="/synthetic-loan-event-format-template.csv" download');
    expect(help).toContain("no format-submission upload or support attachment workflow");

    expect(everydayTemplate).toContain("DATE_COLUMN,DESCRIPTION_COLUMN");
    expect(everydayTemplate).toContain("Synthetic grocery");
    expect(everydayTemplate).toContain('"Synthetic description, with comma"');
    expect(loanComponentTemplate).toContain("TOTAL_REPAYMENT_COLUMN,PRINCIPAL_COLUMN,INTEREST_COLUMN,FEE_COLUMN");
    expect(loanComponentTemplate).toContain("1000.00,350.00,640.00,10.00");
    expect(loanEventTemplate).toContain("DESCRIPTION_OR_EVENT_COLUMN,AMOUNT_COLUMN");
    expect(loanEventTemplate).toContain("Synthetic repayment");
    expect(loanEventTemplate).toContain("Synthetic interest");

    const templates = everydayTemplate + loanComponentTemplate + loanEventTemplate;
    expect(templates).not.toMatch(/BSB|account number|card number|customer ID|@|CommBank|ANZ|NAB|Westpac/i);
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
    expect(help).not.toMatch(/fetch\(|<form|type="file"/i);
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
