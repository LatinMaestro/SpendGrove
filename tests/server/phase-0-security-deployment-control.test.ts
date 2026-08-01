import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const packagePath = new URL("../../package.json", import.meta.url);
const lockPath = new URL("../../package-lock.json", import.meta.url);
const vercelPath = new URL("../../vercel.json", import.meta.url);

describe("Phase 0 dependency and deployment controls", () => {
  it("pins the patched framework line and audited transitive overrides", async () => {
    const packageJson = JSON.parse(await readFile(packagePath, "utf8"));

    expect(packageJson.dependencies.next).toBe("15.5.22");
    expect(packageJson.devDependencies["eslint-config-next"]).toBe("15.5.22");
    expect(packageJson.devDependencies.postcss).toBe("8.5.19");
    expect(packageJson.overrides).toEqual({
      postcss: "$postcss",
      sharp: "0.35.0",
    });
  });

  it("resolves one patched PostCSS tree and the patched Sharp release", async () => {
    const lockfile = JSON.parse(await readFile(lockPath, "utf8"));
    const packages = lockfile.packages as Record<string, { version?: string }>;

    expect(packages["node_modules/next"]?.version).toBe("15.5.22");
    expect(packages["node_modules/postcss"]?.version).toBe("8.5.19");
    expect(packages["node_modules/next/node_modules/postcss"]).toBeUndefined();
    expect(packages["node_modules/sharp"]?.version).toBe("0.35.0");
  });

  it("disables automatic Vercel Git deployments without changing build isolation", async () => {
    const config = JSON.parse(await readFile(vercelPath, "utf8"));

    expect(config.git).toEqual({ deploymentEnabled: false });
    expect(config.build.env.DATABASE_URL).toBe(
      "postgresql://build:build@127.0.0.1:5432/spendgrove_build?schema=public",
    );
  });
});
