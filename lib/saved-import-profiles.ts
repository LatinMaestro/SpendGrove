import { z } from "zod";
import {
  scanCsvDocument,
  type CsvMapping,
  type CsvScanResult,
  type TransientCsvDocument,
} from "@/lib/csv-import";
import {
  safeImportProfileContractSchema,
  type SafeImportProfileContract,
} from "@/lib/import-profile-contract";

export const SAVED_IMPORT_PROFILE_STORAGE_KEY = "spendgrove.phase2.import-profiles.v1";
export const SAVED_IMPORT_PROFILE_STORAGE_VERSION = 1 as const;
export const SAVED_IMPORT_PROFILE_LIMIT = 30;
export const SAVED_IMPORT_PROFILE_MATCH_THRESHOLD = 70;

export type SavedImportProfile = {
  id: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  contract: SafeImportProfileContract;
};

export type SavedImportProfileMatch = {
  profile: SavedImportProfile;
  score: number;
  reason: string;
};

export type SavedImportProfileStorageResult = {
  profiles: SavedImportProfile[];
  recoveredFromCorruption: boolean;
  migrated: boolean;
  unsupportedVersion: boolean;
};

export type SavedImportProfileStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const savedProfileIdSchema = z.string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/i, "Saved mapping IDs must contain safe characters only.");

const timestampSchema = z.string().datetime();

const savedImportProfileSchema = z.object({
  id: savedProfileIdSchema,
  isEnabled: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  lastUsedAt: timestampSchema.nullable(),
  contract: safeImportProfileContractSchema,
}).strict();

const savedImportProfileStorageSchema = z.object({
  version: z.literal(SAVED_IMPORT_PROFILE_STORAGE_VERSION),
  profiles: z.array(savedImportProfileSchema).max(SAVED_IMPORT_PROFILE_LIMIT),
}).strict().superRefine((storage, context) => {
  const ids = new Set<string>();
  storage.profiles.forEach((profile, index) => {
    if (ids.has(profile.id)) {
      context.addIssue({
        code: "custom",
        path: ["profiles", index, "id"],
        message: "Saved mapping IDs must be unique.",
      });
    }
    ids.add(profile.id);
  });
});

const legacySavedImportProfileStorageSchema = z.object({
  version: z.literal(0),
  profiles: z.array(z.object({
    id: savedProfileIdSchema,
    enabled: z.boolean(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    lastUsedAt: timestampSchema.nullable().optional(),
    contract: safeImportProfileContractSchema,
  }).strict()).max(SAVED_IMPORT_PROFILE_LIMIT),
}).strict();

function createLocalId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return `mapping-${globalThis.crypto.randomUUID()}`;
  }
  return `mapping-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sortedProfiles(profiles: SavedImportProfile[]) {
  return [...profiles].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function sameNumberList(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  return [...left].sort((a, b) => a - b).every((value, index) => value === [...right].sort((a, b) => a - b)[index]);
}

function roleAgreement(profile: SavedImportProfile, scan: CsvScanResult) {
  if (profile.contract.columnRoles.length === 0) return 0;
  const matchingRoles = profile.contract.columnRoles.filter((entry) =>
    scan.columns[entry.columnIndex]?.suggestedRole === entry.role,
  ).length;
  return matchingRoles / profile.contract.columnRoles.length;
}

export function createSavedImportProfile(input: {
  contract: SafeImportProfileContract;
  id?: string;
  now?: Date;
}) {
  const timestamp = (input.now ?? new Date()).toISOString();
  return savedImportProfileSchema.parse({
    id: input.id ?? createLocalId(),
    isEnabled: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastUsedAt: null,
    contract: input.contract,
  });
}

export function addSavedImportProfile(
  profiles: SavedImportProfile[],
  profile: SavedImportProfile,
) {
  const validatedProfile = savedImportProfileSchema.parse(profile);
  const withoutExisting = profiles.filter((candidate) => candidate.id !== validatedProfile.id);
  return sortedProfiles([validatedProfile, ...withoutExisting]).slice(0, SAVED_IMPORT_PROFILE_LIMIT);
}

export function renameSavedImportProfile(
  profiles: SavedImportProfile[],
  profileId: string,
  displayName: string,
  now = new Date(),
) {
  return profiles.map((profile) => profile.id === profileId
    ? savedImportProfileSchema.parse({
        ...profile,
        updatedAt: now.toISOString(),
        contract: { ...profile.contract, displayName },
      })
    : profile);
}

export function setSavedImportProfileEnabled(
  profiles: SavedImportProfile[],
  profileId: string,
  isEnabled: boolean,
  now = new Date(),
) {
  return profiles.map((profile) => profile.id === profileId
    ? savedImportProfileSchema.parse({
        ...profile,
        isEnabled,
        updatedAt: now.toISOString(),
      })
    : profile);
}

export function deleteSavedImportProfile(profiles: SavedImportProfile[], profileId: string) {
  return profiles.filter((profile) => profile.id !== profileId);
}

export function markSavedImportProfileUsed(
  profiles: SavedImportProfile[],
  profileId: string,
  now = new Date(),
) {
  return sortedProfiles(profiles.map((profile) => profile.id === profileId
    ? savedImportProfileSchema.parse({
        ...profile,
        updatedAt: now.toISOString(),
        lastUsedAt: now.toISOString(),
      })
    : profile));
}

export function savedImportProfileToMapping(profile: SavedImportProfile): CsvMapping {
  const mapping: CsvMapping = Object.fromEntries(
    Array.from({ length: profile.contract.columnCount }, (_, index) => [index, "IGNORE"]),
  );
  profile.contract.privateColumnIndexes.forEach((index) => {
    mapping[index] = "PRIVATE";
  });
  profile.contract.columnRoles.forEach((entry) => {
    mapping[entry.columnIndex] = entry.role;
  });
  return mapping;
}

export function applySavedImportProfile(
  document: TransientCsvDocument,
  profile: SavedImportProfile,
) {
  if (!profile.isEnabled) throw new Error("This saved mapping is disabled.");
  if (profile.contract.columnCount !== document.headers.length || profile.contract.hasHeader !== document.hasHeader) {
    throw new Error("This saved mapping does not fit the selected file. Check the columns manually.");
  }
  const scan = scanCsvDocument(document, savedImportProfileToMapping(profile));
  if (scan.mappingIssues.length > 0) {
    throw new Error("This saved mapping is out of date for the selected file. Check the columns manually.");
  }
  return scan;
}

export function scoreSavedImportProfile(profile: SavedImportProfile, scan: CsvScanResult) {
  if (!profile.isEnabled) return null;
  if (profile.contract.columnCount !== scan.columns.length) return null;
  if (profile.contract.hasHeader !== scan.hasHeader) return null;
  if (profile.contract.amountMode !== scan.amountMode) return null;

  let score = 70;
  const currentPrivateIndexes = scan.columns.filter((column) => column.isPrivate).map((column) => column.index);
  if (sameNumberList(profile.contract.privateColumnIndexes, currentPrivateIndexes)) score += 10;

  const dateFormatMatches = profile.contract.dateFormats.length === 0 || scan.detectedDateFormats.length === 0
    ? 0.5
    : profile.contract.dateFormats.some((format) => scan.detectedDateFormats.includes(format)) ? 1 : 0;
  score += Math.round(dateFormatMatches * 10);
  score += Math.round(roleAgreement(profile, scan) * 10);

  return Math.min(100, score);
}

export function matchSavedImportProfiles(
  profiles: SavedImportProfile[],
  scan: CsvScanResult,
): SavedImportProfileMatch[] {
  return profiles
    .map((profile) => ({ profile, score: scoreSavedImportProfile(profile, scan) }))
    .filter((candidate): candidate is { profile: SavedImportProfile; score: number } =>
      candidate.score !== null && candidate.score >= SAVED_IMPORT_PROFILE_MATCH_THRESHOLD,
    )
    .sort((left, right) => right.score - left.score || right.profile.updatedAt.localeCompare(left.profile.updatedAt))
    .map((candidate) => ({
      ...candidate,
      reason: candidate.score >= 90
        ? "Strong match for this file structure."
        : "Possible match. Check the preview before continuing.",
    }));
}

export function parseSavedImportProfileStorage(rawValue: string | null): SavedImportProfileStorageResult {
  if (!rawValue) {
    return { profiles: [], recoveredFromCorruption: false, migrated: false, unsupportedVersion: false };
  }

  try {
    const json: unknown = JSON.parse(rawValue);
    const current = savedImportProfileStorageSchema.safeParse(json);
    if (current.success) {
      return {
        profiles: sortedProfiles(current.data.profiles),
        recoveredFromCorruption: false,
        migrated: false,
        unsupportedVersion: false,
      };
    }

    const legacy = legacySavedImportProfileStorageSchema.safeParse(json);
    if (legacy.success) {
      const profiles = legacy.data.profiles.map((profile) => savedImportProfileSchema.parse({
        id: profile.id,
        isEnabled: profile.enabled,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        lastUsedAt: profile.lastUsedAt ?? null,
        contract: profile.contract,
      }));
      return {
        profiles: sortedProfiles(profiles),
        recoveredFromCorruption: false,
        migrated: true,
        unsupportedVersion: false,
      };
    }

    const version = typeof json === "object" && json !== null && "version" in json
      ? (json as { version?: unknown }).version
      : undefined;
    return {
      profiles: [],
      recoveredFromCorruption: version === undefined || version === SAVED_IMPORT_PROFILE_STORAGE_VERSION,
      migrated: false,
      unsupportedVersion: typeof version === "number" && version > SAVED_IMPORT_PROFILE_STORAGE_VERSION,
    };
  } catch {
    return { profiles: [], recoveredFromCorruption: true, migrated: false, unsupportedVersion: false };
  }
}

export function serializeSavedImportProfileStorage(profiles: SavedImportProfile[]) {
  return JSON.stringify(savedImportProfileStorageSchema.parse({
    version: SAVED_IMPORT_PROFILE_STORAGE_VERSION,
    profiles: sortedProfiles(profiles),
  }));
}

export function loadSavedImportProfilesFromStorage(storage: SavedImportProfileStorage) {
  try {
    return {
      ...parseSavedImportProfileStorage(storage.getItem(SAVED_IMPORT_PROFILE_STORAGE_KEY)),
      storageAvailable: true,
    };
  } catch {
    return {
      profiles: [],
      recoveredFromCorruption: false,
      migrated: false,
      unsupportedVersion: false,
      storageAvailable: false,
    };
  }
}

export function saveSavedImportProfilesToStorage(
  storage: SavedImportProfileStorage,
  profiles: SavedImportProfile[],
) {
  try {
    storage.setItem(SAVED_IMPORT_PROFILE_STORAGE_KEY, serializeSavedImportProfileStorage(profiles));
    return true;
  } catch {
    return false;
  }
}

export function resetSavedImportProfilesInStorage(storage: SavedImportProfileStorage) {
  try {
    storage.removeItem(SAVED_IMPORT_PROFILE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
