import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const CLIENT_FACING_DIRS = ["app", "components", "lib"];
const CLIENT_FILE_EXTENSIONS = new Set([".ts", ".tsx"]);
const SERVER_DB_IMPORT_PATTERNS = [
  /from\s+["']@\/src\/server\/db["']/,
  /from\s+["']@\/src\/server["']/,
  /from\s+["']\.\.\/src\/server\/db["']/,
  /from\s+["']\.\/src\/server\/db["']/,
  /PrismaClient/,
];
const PRODUCT_WRITE_PATTERNS = [
  /transaction\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
  /importBatch\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
  /importRow\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
  /category\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
  /bankImportProfile\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
  /merchantProfile\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
  /merchantAlias\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
  /merchantRule\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
];

async function listFiles(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return listFiles(entryPath);
      }

      if (CLIENT_FILE_EXTENSIONS.has(path.extname(entry.name))) {
        return [entryPath];
      }

      return [];
    }));

    return files.flat();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

describe("server persistence boundaries", () => {
  it("keeps Prisma and server db imports out of client-facing source folders", async () => {
    const files = (await Promise.all(CLIENT_FACING_DIRS.map(listFiles))).flat();
    const violations: string[] = [];

    for (const file of files) {
      const source = await readFile(file, "utf8");

      if (SERVER_DB_IMPORT_PATTERNS.some((pattern) => pattern.test(source))) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not add transaction, import, category or merchant product write paths", async () => {
    const files = await listFiles("src/server");
    const violations: string[] = [];

    for (const file of files) {
      const source = await readFile(file, "utf8");

      if (PRODUCT_WRITE_PATTERNS.some((pattern) => pattern.test(source))) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });
});
