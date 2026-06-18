import type { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { safeImportProfileContractSchema } from "@/lib/import-profile-contract";
import {
  createSavedImportProfile,
  markSavedImportProfileUsed,
  setSavedImportProfileEnabled,
  type SavedImportProfile,
} from "@/lib/saved-import-profiles";
import { assertSafeJson } from "@/lib/validation/privacy";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { assertUserOwnsRecord, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

const durableProfileEnvelopeSchema = z.object({
  storageVersion: z.literal(1),
  isEnabled: z.boolean(),
  lastUsedAt: z.string().datetime().nullable(),
  contract: safeImportProfileContractSchema,
}).strict();

type DurableProfileEnvelope = z.infer<typeof durableProfileEnvelopeSchema>;

export type DbSavedImportProfileRecord = {
  id: string;
  userId: string;
  displayName: string;
  bankName?: string | null;
  accountType?: string | null;
  hasHeader: boolean;
  dateFormats: string[];
  columnMapping: Prisma.JsonValue | unknown;
  confidence: number;
  isUserConfirmed: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type SavedImportProfilePersistenceStore = {
  list(userId: string): Promise<DbSavedImportProfileRecord[]>;
  listNames(userId: string): Promise<Array<{ id: string; displayName: string }>>;
  findById(userId: string, profileId: string): Promise<DbSavedImportProfileRecord | null>;
  create(userId: string, profile: SavedImportProfile, envelope: DurableProfileEnvelope): Promise<DbSavedImportProfileRecord>;
  update(userId: string, profileId: string, data: { displayName?: string; bankName?: string | null; accountType?: string; hasHeader?: boolean; dateFormats?: string[]; columnMapping?: Prisma.InputJsonValue; confidence?: number }): Promise<DbSavedImportProfileRecord>;
  delete(userId: string, profileId: string): Promise<void>;
  deleteAll(userId: string): Promise<number>;
};

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizedName(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-AU");
}

function validateProfile(profile: SavedImportProfile) {
  let validated = createSavedImportProfile({
    id: profile.id,
    contract: profile.contract,
    now: new Date(profile.createdAt),
  });
  if (!profile.isEnabled) {
    validated = setSavedImportProfileEnabled(validated ? [validated] : [], profile.id, false, new Date(profile.updatedAt))[0];
  }
  if (profile.lastUsedAt) {
    validated = markSavedImportProfileUsed([validated], profile.id, new Date(profile.lastUsedAt))[0];
  }
  return validated;
}

function toEnvelope(profile: SavedImportProfile): DurableProfileEnvelope {
  const envelope = durableProfileEnvelopeSchema.parse({
    storageVersion: 1,
    isEnabled: profile.isEnabled,
    lastUsedAt: profile.lastUsedAt,
    contract: profile.contract,
  });
  assertSafeJson(envelope, "saved import profile");
  return envelope;
}

function toSavedProfile(record: DbSavedImportProfileRecord): SavedImportProfile {
  const envelope = durableProfileEnvelopeSchema.parse(record.columnMapping);
  return {
    id: record.id,
    isEnabled: envelope.isEnabled,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
    lastUsedAt: envelope.lastUsedAt,
    contract: envelope.contract,
  };
}

function assertNameAvailable(
  displayName: string,
  existing: Array<{ id: string; displayName: string }>,
  excludedId?: string,
) {
  const normalized = normalizedName(displayName);
  if (existing.some((profile) => profile.id !== excludedId && normalizedName(profile.displayName) === normalized)) {
    throw new Error("A saved mapping with this name already exists.");
  }
}

export function createPrismaSavedImportProfileStore(prisma: PrismaClient = getPrismaClient()): SavedImportProfilePersistenceStore {
  return {
    async list(userId) {
      return prisma.bankImportProfile.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }) as unknown as Promise<DbSavedImportProfileRecord[]>;
    },
    async listNames(userId) {
      return prisma.bankImportProfile.findMany({
        where: { userId },
        select: { id: true, displayName: true },
      });
    },
    async findById(userId, profileId) {
      return prisma.bankImportProfile.findFirst({
        where: { id: profileId, userId },
      }) as unknown as Promise<DbSavedImportProfileRecord | null>;
    },
    async create(userId, profile, envelope) {
      return prisma.bankImportProfile.create({
        data: {
          id: profile.id,
          userId,
          displayName: profile.contract.displayName,
          bankName: profile.contract.bankName ?? null,
          accountType: profile.contract.accountType,
          hasHeader: profile.contract.hasHeader,
          dateFormats: profile.contract.dateFormats,
          columnMapping: envelope as Prisma.InputJsonValue,
          ignoredHeaders: [],
          privateHeaderPatterns: [],
          confidence: profile.contract.confidence,
          isUserConfirmed: true,
        },
      }) as unknown as Promise<DbSavedImportProfileRecord>;
    },
    async update(_userId, profileId, data) {
      return prisma.bankImportProfile.update({
        where: { id: profileId },
        data,
      }) as unknown as Promise<DbSavedImportProfileRecord>;
    },
    async delete(_userId, profileId) {
      await prisma.bankImportProfile.delete({ where: { id: profileId } });
    },
    async deleteAll(userId) {
      const result = await prisma.bankImportProfile.deleteMany({ where: { userId } });
      return result.count;
    },
  };
}

export async function listDurableSavedImportProfiles(
  context: AuthenticatedUserContext | null | undefined,
  store: SavedImportProfilePersistenceStore = createPrismaSavedImportProfileStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  return (await store.list(user.userId)).map(toSavedProfile);
}

export async function createDurableSavedImportProfile(
  context: AuthenticatedUserContext | null | undefined,
  input: SavedImportProfile,
  store: SavedImportProfilePersistenceStore = createPrismaSavedImportProfileStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const profile = validateProfile(input);
  const existing = await store.listNames(user.userId);
  assertNameAvailable(profile.contract.displayName, existing);
  const record = await store.create(user.userId, profile, toEnvelope(profile));
  assertUserOwnsRecord(user, record, "saved import profile");
  return toSavedProfile(record);
}

export async function updateDurableSavedImportProfile(
  context: AuthenticatedUserContext | null | undefined,
  profileId: string,
  input: { displayName?: string; isEnabled?: boolean; markUsed?: boolean },
  store: SavedImportProfilePersistenceStore = createPrismaSavedImportProfileStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const existingRecord = await store.findById(user.userId, profileId);
  assertUserOwnsRecord(user, existingRecord, "saved import profile");
  let profile = toSavedProfile(existingRecord);

  if (input.displayName !== undefined) {
    const contract = safeImportProfileContractSchema.parse({ ...profile.contract, displayName: input.displayName });
    const names = await store.listNames(user.userId);
    assertNameAvailable(contract.displayName, names, profileId);
    profile = { ...profile, contract };
  }
  if (input.isEnabled !== undefined) {
    profile = setSavedImportProfileEnabled([profile], profileId, input.isEnabled)[0];
  }
  if (input.markUsed) {
    profile = markSavedImportProfileUsed([profile], profileId)[0];
  }
  if (input.displayName === undefined && input.isEnabled === undefined && !input.markUsed) {
    throw new Error("Choose a saved mapping change before saving.");
  }

  const envelope = toEnvelope(profile);
  const record = await store.update(user.userId, profileId, {
    displayName: profile.contract.displayName,
    bankName: profile.contract.bankName ?? null,
    accountType: profile.contract.accountType,
    hasHeader: profile.contract.hasHeader,
    dateFormats: profile.contract.dateFormats,
    columnMapping: envelope as Prisma.InputJsonValue,
    confidence: profile.contract.confidence,
  });
  assertUserOwnsRecord(user, record, "saved import profile");
  return toSavedProfile(record);
}

export async function deleteDurableSavedImportProfile(
  context: AuthenticatedUserContext | null | undefined,
  profileId: string,
  store: SavedImportProfilePersistenceStore = createPrismaSavedImportProfileStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const existing = await store.findById(user.userId, profileId);
  assertUserOwnsRecord(user, existing, "saved import profile");
  await store.delete(user.userId, profileId);
}

export async function resetDurableSavedImportProfiles(
  context: AuthenticatedUserContext | null | undefined,
  store: SavedImportProfilePersistenceStore = createPrismaSavedImportProfileStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  return store.deleteAll(user.userId);
}

export async function migrateDurableSavedImportProfiles(
  context: AuthenticatedUserContext | null | undefined,
  localProfiles: SavedImportProfile[],
  store: SavedImportProfilePersistenceStore = createPrismaSavedImportProfileStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const validated = localProfiles.map(validateProfile);
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  validated.forEach((profile) => {
    const name = normalizedName(profile.contract.displayName);
    if (seenIds.has(profile.id) || seenNames.has(name)) throw new Error("Saved mappings selected for migration must be unique.");
    seenIds.add(profile.id);
    seenNames.add(name);
  });

  const existing = await store.listNames(user.userId);
  const existingIds = new Set(existing.map((profile) => profile.id));
  const existingNames = new Set(existing.map((profile) => normalizedName(profile.displayName)));
  let importedCount = 0;
  let skippedCount = 0;

  for (const profile of validated) {
    const name = normalizedName(profile.contract.displayName);
    if (existingIds.has(profile.id) || existingNames.has(name)) {
      skippedCount += 1;
      continue;
    }
    const record = await store.create(user.userId, profile, toEnvelope(profile));
    assertUserOwnsRecord(user, record, "saved import profile");
    existingIds.add(profile.id);
    existingNames.add(name);
    importedCount += 1;
  }

  return {
    profiles: (await store.list(user.userId)).map(toSavedProfile),
    importedCount,
    skippedCount,
  };
}
