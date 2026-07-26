import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const managerPath = new URL("../components/merchant-rule-manager.tsx", import.meta.url);

function functionBody(source: string, name: string) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) return "";
  const next = source.indexOf("\n  function ", start + 1);
  return source.slice(start, next < 0 ? source.length : next);
}

describe("Phase C3 merchant provenance and accessibility", () => {
  it("maps supported rule types to plain-English labels without rendering patterns", async () => {
    const source = await readFile(managerPath, "utf8");

    expect(source).toContain('EXACT: "Exact merchant match"');
    expect(source).toContain('STARTS_WITH: "Name starts with"');
    expect(source).toContain('CONTAINS: "Name contains"');
    expect(source).toContain("merchantRuleTypeLabel(rule.type)");
    expect(source).not.toContain("rule.normalizedPattern");
    expect(source).not.toContain("rule.priority");
  });

  it("resolves active account Categories before seeded fallback", async () => {
    const source = await readFile(managerPath, "utf8");
    const helper = functionBody(source, "merchantCategoryName");

    expect(helper).toContain("categoryOptions.find");
    expect(helper).toContain("getManualCategory(categoryId)?.name");
    expect(helper.indexOf("categoryOptions.find")).toBeLessThan(helper.indexOf("getManualCategory"));
    expect(helper).toContain('"Category unavailable"');
    expect(source).toContain("merchantCategoryName(rule.categoryId, categoryOptions)");
  });

  it("shows Australian saved dates as context rather than inferred provenance", async () => {
    const source = await readFile(managerPath, "utf8");

    expect(source).toContain('new Intl.DateTimeFormat("en-AU"');
    expect(source).toContain('timeZone: "Australia/Brisbane"');
    expect(source).toContain("formatSavedMerchantDate(rule.createdAt)");
    expect(source).toContain("` · Saved ${savedDate}`");
    expect(source).not.toMatch(/AI learned|bank verified|created from this CSV|automatically categorised/i);
  });

  it("states that merchant suggestions affect future reviews only", async () => {
    const source = await readFile(managerPath, "utf8");

    expect(source).toContain("Saved suggestions come from choices you reviewed.");
    expect(source).toContain("they do not silently edit existing transactions.");
    expect(source).toContain("Existing transactions are not changed.");
    expect(source).toContain("when it matches the transaction direction");
  });

  it("uses explicit conflict choices and preserves no-write cancellation", async () => {
    const source = await readFile(managerPath, "utf8");

    expect(source).toContain("This matching name is already saved for another merchant");
    expect(source).toContain("future reviews only");
    expect(source).toContain("Existing transactions and Categories will not be changed.");
    expect(source).toContain('onChoose("REPLACE")');
    expect(source).toContain('onChoose("KEEP_EXISTING")');
    expect(source).toContain('onChoose("CANCEL")');
    expect(source).toContain("Use new merchant for this match");
    expect(source).toContain("Keep current merchant");
  });

  it("provides an explicit alias-edit Cancel path without mutation", async () => {
    const source = await readFile(managerPath, "utf8");
    const cancelBody = functionBody(source, "cancelAliasEdit");

    expect(cancelBody).toContain("setAliasConflict(null)");
    expect(cancelBody).toContain("setAliasEdit(null)");
    expect(cancelBody).toContain("aliasRenameButtonRefs.current[aliasId]?.focus()");
    expect(cancelBody).not.toContain("onRenameAlias");
    expect(source).toContain('onClick={cancelAliasEdit}');
  });

  it("uses a callback ref to remove load/save dependency warnings safely", async () => {
    const source = await readFile(managerPath, "utf8");

    expect(source).toContain("const onDataChangeRef = useRef(onDataChange)");
    expect(source).toContain("onDataChangeRef.current = onDataChange");
    expect(source).toContain("}, [onDataChange]);");
    expect(source).toContain("onDataChangeRef.current(result.data)");
    expect(source).not.toMatch(/\bonDataChange\(result\.data\)/);
    expect(source).not.toMatch(/eslint-disable|exhaustive-deps/);
  });

  it("applies accessible focus, disclosure, status and mobile wrapping semantics", async () => {
    const source = await readFile(managerPath, "utf8");

    expect(source).toContain('focus-visible:ring-2 focus-visible:ring-focus');
    expect(source).toContain('min-h-11 cursor-pointer');
    expect(source).toContain("Manage matching names and merchant details");
    expect(source).toContain('role={messageKind === "ERROR" ? "alert" : "status"}');
    expect(source).toContain('className="flex flex-col gap-2 sm:flex-row');
    expect(source).toContain("· Disabled");
  });

  it("does not cross merchant merge, schema, provider or financial boundaries", async () => {
    const source = await readFile(managerPath, "utf8");

    expect(source).not.toMatch(/MerchantMerge|merge preview|apply category to past/i);
    expect(source).not.toMatch(/amountCents|balance|loan|property|transaction\.update/i);
    expect(source).not.toMatch(/fetch\(.*merchant.*merge|POST|PATCH|DELETE/);
    expect(source).not.toMatch(/localStorage|sessionStorage|analytics|provider/i);
  });
});
