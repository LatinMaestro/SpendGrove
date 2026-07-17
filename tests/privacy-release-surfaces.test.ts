import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const pagePath = new URL("../app/privacy/page.tsx", import.meta.url);
const settingsPath = new URL("../components/settings-panel.tsx", import.meta.url);
const contactPath = new URL("../lib/release-contact.ts", import.meta.url);
const draftPath = new URL("../docs/PRIVACY_POLICY_DRAFT.md", import.meta.url);

describe("Phase 5 privacy release surfaces", () => {
  it("explains implemented data handling in plain English", async () => {
    const page = await readFile(pagePath, "utf8");
    for (const statement of [
      "does not ask for your internet-banking username",
      "Raw CSV files are not retained",
      "Clerk provides sign-in",
      "Vercel hosts",
      "Neon provides",
      "Product analytics is currently off",
      "not automatically uploaded",
      "download a versioned JSON copy",
      "permanently removes account-owned application records",
      "does not provide tax, legal, investment, debt or credit advice",
    ]) {
      expect(page).toContain(statement);
    }
  });

  it("labels the policy as pre-release and does not invent contact details", async () => {
    const [page, contact, draft] = await Promise.all([
      readFile(pagePath, "utf8"),
      readFile(contactPath, "utf8"),
      readFile(draftPath, "utf8"),
    ]);
    expect(page).toContain("Pre-release notice");
    expect(page).toContain("final factual and legal review");
    expect(contact).toContain("Groveware support contact details will be published");
    expect(draft).toContain("not approved legal advice");
    expect(draft).toContain("Do not publish invented contact details");
    expect(page + contact + draft).not.toMatch(/mailto:|support@|privacy@|\+61\s?\d|ABN\s?\d/i);
  });

  it("covers export, deletion, retention and professional-review decisions", async () => {
    const draft = await readFile(draftPath, "utf8");
    expect(draft).toContain("Export");
    expect(draft).toContain("Deletion");
    expect(draft).toContain("database backup/PITR retention");
    expect(draft).toContain("cross-border disclosure wording");
    expect(draft).toContain("Privacy Act 1988");
    expect(draft).toContain("Australian Privacy Principles");
    expect(draft).toContain("Clerk Production instance");
  });

  it("links Settings to the public privacy page without changing finance navigation", async () => {
    const settings = await readFile(settingsPath, "utf8");
    expect(settings).toContain('href="/privacy"');
    expect(settings).toContain("Read SpendGrove privacy information");
    expect(settings).not.toContain("Privacy Policy URL pending");
  });

  it("does not add analytics, bank linking, AI or payment behaviour", async () => {
    const page = await readFile(pagePath, "utf8");
    expect(page).toContain("Live bank linking is not enabled");
    expect(page).toContain("No behavioural analytics");
    expect(page).not.toMatch(/useEffect\(|fetch\(|POST|analytics\.track|gtag\(/);
  });
});
