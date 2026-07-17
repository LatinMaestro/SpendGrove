import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [target] : [];
  }));
  return nested.flat();
}

describe("safe runtime errors and logging", () => {
  it("keeps direct console logging out of application and server runtime source", async () => {
    const files = (await Promise.all(["app", "src/server"].map(sourceFiles))).flat();
    const violations: string[] = [];

    for (const file of files) {
      const source = await readFile(file, "utf8");
      if (/console\.(?:log|info|warn|error|debug)\s*\(/.test(source)) {
        violations.push(file.split(path.sep).join("/"));
      }
    }

    expect(violations).toEqual([]);
  });

  it("provides generic retry and not-found surfaces without technical error details", async () => {
    const [routeError, globalError, notFound] = await Promise.all([
      readFile("app/error.tsx", "utf8"),
      readFile("app/global-error.tsx", "utf8"),
      readFile("app/not-found.tsx", "utf8"),
    ]);
    const combined = [routeError, globalError, notFound].join("\n");

    expect(routeError).toContain("Something went wrong");
    expect(routeError).toContain("Try again");
    expect(globalError).toContain("SpendGrove could not load");
    expect(notFound).toContain("Page not found");
    expect(combined).not.toMatch(/error\.message|error\.stack|digest|console\./);
  });

  it("preserves accessible recovery controls", async () => {
    const [routeError, globalError, notFound] = await Promise.all([
      readFile("app/error.tsx", "utf8"),
      readFile("app/global-error.tsx", "utf8"),
      readFile("app/not-found.tsx", "utf8"),
    ]);

    expect(routeError).toContain('type="button"');
    expect(routeError).toContain("min-h-11");
    expect(globalError).toContain('type="button"');
    expect(globalError).toContain("minHeight: 44");
    expect(notFound).toContain("min-h-11");
  });
});
