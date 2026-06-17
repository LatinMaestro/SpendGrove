import { PrismaClient } from "@prisma/client";
import { getRequiredDatabaseRuntimeEnv, type EnvSource } from "@/src/server/env";

type PrismaClientFactory = (databaseUrl: string) => PrismaClient;

type PrismaCache = {
  client?: PrismaClient;
  databaseUrl?: string;
};

type RuntimeProbe = {
  hasWindow: boolean;
};

const globalForPrisma = globalThis as typeof globalThis & {
  __spendgrovePrisma?: PrismaCache;
};

export const PRISMA_SERVER_ONLY_BOUNDARY = "SpendGrove Prisma access is server-only";

export function assertServerOnlyRuntime(runtime: RuntimeProbe = { hasWindow: typeof window !== "undefined" }) {
  if (runtime.hasWindow) {
    throw new Error(`${PRISMA_SERVER_ONLY_BOUNDARY}; client components must not import src/server/db.`);
  }
}

function defaultPrismaClientFactory(databaseUrl: string) {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

function getPrismaCache() {
  globalForPrisma.__spendgrovePrisma ??= {};
  return globalForPrisma.__spendgrovePrisma;
}

export function getPrismaClient(options: {
  env?: EnvSource;
  factory?: PrismaClientFactory;
  useGlobalCache?: boolean;
} = {}) {
  assertServerOnlyRuntime();

  const { DATABASE_URL } = getRequiredDatabaseRuntimeEnv(options.env);
  const useGlobalCache = options.useGlobalCache !== false;
  const cache = getPrismaCache();

  if (useGlobalCache && cache.client && cache.databaseUrl === DATABASE_URL) {
    return cache.client;
  }

  const factory = options.factory ?? defaultPrismaClientFactory;
  const client = factory(DATABASE_URL);

  if (useGlobalCache) {
    cache.client = client;
    cache.databaseUrl = DATABASE_URL;
  }

  return client;
}
