import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function source(path: string) { return readFile(new URL(`../${path}`, import.meta.url), "utf8"); }

describe("reviewed import batching", () => {
  it("uses bulk transaction and import-row writes inside one bounded atomic transaction", async () => {
    const server = await source("src/server/import-commit.ts");
    expect(server).toContain("prisma.$transaction");
    expect(server).toContain("transaction.createMany");
    expect(server).toContain("importRow.createMany");
    expect(server).toContain("categoryByRequestedId");
    expect(server).toContain("timeout: 30_000");
    expect(server).not.toContain("await tx.transaction.create({");
    expect(server).not.toContain("await tx.importRow.create({");
  });
});
