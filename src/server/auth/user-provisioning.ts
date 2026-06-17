import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "@/src/server/db";

export const CLERK_AUTH_PROVIDER = "CLERK" as const;

export type ClerkIdentity = {
  providerUserId: string;
  email?: string | null;
  name?: string | null;
};

export type ProvisionedUser = {
  id: string;
  authProvider: typeof CLERK_AUTH_PROVIDER;
  authProviderUserId: string;
  email?: string | null;
  name?: string | null;
};

export type UserProvisioningStore = {
  findByProviderIdentity(identity: ClerkIdentity): Promise<ProvisionedUser | null>;
  createUserWithSettings(identity: ClerkIdentity): Promise<ProvisionedUser>;
};

export class MissingClerkIdentityError extends Error {
  constructor() {
    super("A Clerk user ID is required before SpendGrove user provisioning.");
    this.name = "MissingClerkIdentityError";
  }
}

function cleanOptionalText(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned && cleaned.length > 0 ? cleaned : null;
}

function toProvisionedUser(user: {
  id: string;
  authProvider: string | null;
  authProviderUserId: string | null;
  email?: string | null;
  name?: string | null;
}): ProvisionedUser {
  if (user.authProvider !== CLERK_AUTH_PROVIDER || !user.authProviderUserId) {
    throw new MissingClerkIdentityError();
  }

  return {
    id: user.id,
    authProvider: CLERK_AUTH_PROVIDER,
    authProviderUserId: user.authProviderUserId,
    email: user.email,
    name: user.name,
  };
}

export function createPrismaUserProvisioningStore(prisma: PrismaClient = getPrismaClient()): UserProvisioningStore {
  return {
    async findByProviderIdentity(identity) {
      const user = await prisma.user.findUnique({
        where: {
          authProvider_authProviderUserId: {
            authProvider: CLERK_AUTH_PROVIDER,
            authProviderUserId: identity.providerUserId,
          },
        },
      });

      return user ? toProvisionedUser(user) : null;
    },
    async createUserWithSettings(identity) {
      const email = cleanOptionalText(identity.email);
      const name = cleanOptionalText(identity.name);

      return prisma.$transaction(async (transaction) => {
        const user = await transaction.user.upsert({
          where: {
            authProvider_authProviderUserId: {
              authProvider: CLERK_AUTH_PROVIDER,
              authProviderUserId: identity.providerUserId,
            },
          },
          create: {
            authProvider: CLERK_AUTH_PROVIDER,
            authProviderUserId: identity.providerUserId,
            email,
            name,
            settings: {
              create: {},
            },
          },
          update: {
            email,
            name,
          },
        });

        await transaction.userSettings.upsert({
          where: {
            userId: user.id,
          },
          create: {
            userId: user.id,
          },
          update: {},
        });

        return toProvisionedUser(user);
      });
    },
  };
}

export async function findOrCreateUserForClerkIdentity(
  identity: ClerkIdentity,
  store: UserProvisioningStore = createPrismaUserProvisioningStore(),
) {
  const providerUserId = cleanOptionalText(identity.providerUserId);

  if (!providerUserId) {
    throw new MissingClerkIdentityError();
  }

  const safeIdentity = {
    providerUserId,
    email: cleanOptionalText(identity.email),
    name: cleanOptionalText(identity.name),
  } satisfies ClerkIdentity;

  const existing = await store.findByProviderIdentity(safeIdentity);

  if (existing) {
    return existing;
  }

  return store.createUserWithSettings(safeIdentity);
}
