import { describe, expect, it } from "vitest";
import { assertServerOnlyRuntime, getPrismaClient, PRISMA_SERVER_ONLY_BOUNDARY } from "@/src/server/db";

const VALID_DATABASE_URL = "postgresql://user:password@example.test:5432/spendgrove?schema=public";

describe("server-only Prisma boundary", () => {
  it("rejects browser runtime imports", () => {
    expect(() => assertServerOnlyRuntime({ hasWindow: true })).toThrow(PRISMA_SERVER_ONLY_BOUNDARY);
  });

  it("does not create Prisma when runtime database env is missing", () => {
    let factoryCalls = 0;

    expect(() => getPrismaClient({
      env: {},
      useGlobalCache: false,
      factory: () => {
        factoryCalls += 1;
        return {} as never;
      },
    })).toThrow(/DATABASE_URL/);

    expect(factoryCalls).toBe(0);
  });

  it("creates Prisma lazily only when server database access is invoked", () => {
    const client = { $disconnect: async () => undefined } as never;
    let receivedDatabaseUrl = "";

    const prisma = getPrismaClient({
      env: { DATABASE_URL: VALID_DATABASE_URL },
      useGlobalCache: false,
      factory: (databaseUrl) => {
        receivedDatabaseUrl = databaseUrl;
        return client;
      },
    });

    expect(prisma).toBe(client);
    expect(receivedDatabaseUrl).toBe(VALID_DATABASE_URL);
  });
});
