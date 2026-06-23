import type {
  LoanPurpose,
  LoanType,
  Prisma,
  PrismaClient,
  PropertyUsage,
} from "@prisma/client";
import { z } from "zod";
import { assertNoPrivateBankIdentifiers } from "@/lib/validation/privacy";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { assertUserOwnsRecord, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

const safeNickname = z.string().trim().min(1, "Enter a safe nickname.").max(80, "Keep the nickname to 80 characters or fewer.");

const loanChoiceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("OWNER_OCCUPIER_HOME"), type: z.literal("HOME_LOAN"), purpose: z.literal("OWNER_OCCUPIER") }),
  z.object({ kind: z.literal("INVESTMENT_PROPERTY"), type: z.literal("HOME_LOAN"), purpose: z.literal("INVESTMENT") }),
  z.object({ kind: z.literal("CAR"), type: z.literal("CAR_LOAN"), purpose: z.literal("PERSONAL") }),
  z.object({ kind: z.literal("PERSONAL"), type: z.literal("PERSONAL_LOAN"), purpose: z.literal("PERSONAL") }),
  z.object({ kind: z.literal("OTHER"), type: z.literal("OTHER"), purpose: z.literal("OTHER") }),
]);

const propertyInputSchema = z.object({
  nickname: safeNickname,
  usage: z.enum(["OWNER_OCCUPIED", "INVESTMENT", "OTHER"]),
});

export const loanAccountCreateSchema = z.object({
  nickname: safeNickname,
  choice: loanChoiceSchema,
  propertyId: z.string().trim().min(1).optional(),
  newProperty: propertyInputSchema.optional(),
}).superRefine((value, context) => {
  if (value.propertyId && value.newProperty) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Choose an existing property or create a new one, not both." });
  }
  if (value.choice.type !== "HOME_LOAN" && (value.propertyId || value.newProperty)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A property is optional only for a home or investment property loan." });
  }
});

export const loanAccountUpdateSchema = z.object({
  nickname: safeNickname.optional(),
  choice: loanChoiceSchema.optional(),
  propertyId: z.string().trim().min(1).nullable().optional(),
  isArchived: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "Choose a loan change before saving.");

export const propertyUpdateSchema = z.object({
  nickname: safeNickname.optional(),
  usage: z.enum(["OWNER_OCCUPIED", "INVESTMENT", "OTHER"]).optional(),
  isArchived: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "Choose a property change before saving.");

export type LoanChoice = z.infer<typeof loanChoiceSchema>;
export type LoanAccountCreateInput = z.infer<typeof loanAccountCreateSchema>;
export type LoanAccountUpdateInput = z.infer<typeof loanAccountUpdateSchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;

export type LoanMetadataProperty = {
  id: string;
  userId: string;
  nickname: string;
  usage: PropertyUsage;
  isArchived: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type LoanMetadataAccount = {
  id: string;
  userId: string;
  propertyId?: string | null;
  nickname: string;
  purpose: LoanPurpose;
  type: LoanType;
  isArchived: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  property?: LoanMetadataProperty | null;
};

export type LoanMetadataStore = {
  listLoans(userId: string): Promise<LoanMetadataAccount[]>;
  listProperties(userId: string): Promise<LoanMetadataProperty[]>;
  findLoan(userId: string, loanId: string): Promise<LoanMetadataAccount | null>;
  findProperty(userId: string, propertyId: string): Promise<LoanMetadataProperty | null>;
  createProperty(userId: string, data: { nickname: string; usage: PropertyUsage }): Promise<LoanMetadataProperty>;
  createLoan(userId: string, data: { nickname: string; type: LoanType; purpose: LoanPurpose; propertyId?: string | null }): Promise<LoanMetadataAccount>;
  createLoanWithProperty(userId: string, loan: { nickname: string; type: LoanType; purpose: LoanPurpose }, property: { nickname: string; usage: PropertyUsage }): Promise<LoanMetadataAccount>;
  updateLoan(userId: string, loanId: string, data: { nickname?: string; type?: LoanType; purpose?: LoanPurpose; propertyId?: string | null; isArchived?: boolean; archivedAt?: Date | null }): Promise<LoanMetadataAccount>;
  updateProperty(userId: string, propertyId: string, data: { nickname?: string; usage?: PropertyUsage; isArchived?: boolean; archivedAt?: Date | null }): Promise<LoanMetadataProperty>;
};

const loanInclude = { property: true } satisfies Prisma.LoanAccountInclude;

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function validateSafeNickname(value: string, label: string) {
  const nickname = safeNickname.parse(value);
  assertNoPrivateBankIdentifiers(nickname, label);
  return nickname;
}

function toProperty(record: LoanMetadataProperty) {
  return {
    id: record.id,
    nickname: record.nickname,
    usage: record.usage,
    isArchived: record.isArchived,
    createdAt: iso(record.createdAt),
    updatedAt: iso(record.updatedAt),
  };
}

function toLoan(record: LoanMetadataAccount) {
  return {
    id: record.id,
    propertyId: record.propertyId ?? null,
    nickname: record.nickname,
    purpose: record.purpose,
    type: record.type,
    isArchived: record.isArchived,
    createdAt: iso(record.createdAt),
    updatedAt: iso(record.updatedAt),
    property: record.property ? toProperty(record.property) : null,
  };
}

function assertChoice(type: LoanType, purpose: LoanPurpose) {
  return loanChoiceSchema.parse({
    kind:
      type === "HOME_LOAN" && purpose === "OWNER_OCCUPIER" ? "OWNER_OCCUPIER_HOME"
      : type === "HOME_LOAN" && purpose === "INVESTMENT" ? "INVESTMENT_PROPERTY"
      : type === "CAR_LOAN" && purpose === "PERSONAL" ? "CAR"
      : type === "PERSONAL_LOAN" && purpose === "PERSONAL" ? "PERSONAL"
      : "OTHER",
    type,
    purpose,
  });
}

export function createPrismaLoanMetadataStore(prisma: PrismaClient = getPrismaClient()): LoanMetadataStore {
  return {
    async listLoans(userId) {
      return prisma.loanAccount.findMany({
        where: { userId, deletedAt: null },
        include: loanInclude,
        orderBy: [{ isArchived: "asc" }, { updatedAt: "desc" }],
      }) as unknown as Promise<LoanMetadataAccount[]>;
    },
    async listProperties(userId) {
      return prisma.property.findMany({
        where: { userId, deletedAt: null },
        orderBy: [{ isArchived: "asc" }, { nickname: "asc" }],
      }) as unknown as Promise<LoanMetadataProperty[]>;
    },
    async findLoan(userId, loanId) {
      return prisma.loanAccount.findFirst({
        where: { id: loanId, userId, deletedAt: null },
        include: loanInclude,
      }) as unknown as Promise<LoanMetadataAccount | null>;
    },
    async findProperty(userId, propertyId) {
      return prisma.property.findFirst({
        where: { id: propertyId, userId, deletedAt: null },
      }) as unknown as Promise<LoanMetadataProperty | null>;
    },
    async createProperty(userId, data) {
      return prisma.property.create({ data: { userId, ...data } }) as unknown as Promise<LoanMetadataProperty>;
    },
    async createLoan(userId, data) {
      return prisma.loanAccount.create({
        data: { userId, ...data },
        include: loanInclude,
      }) as unknown as Promise<LoanMetadataAccount>;
    },
    async createLoanWithProperty(userId, loan, property) {
      return prisma.$transaction(async (transaction) => {
        const createdProperty = await transaction.property.create({
          data: { userId, ...property },
        });
        return transaction.loanAccount.create({
          data: { userId, ...loan, propertyId: createdProperty.id },
          include: loanInclude,
        });
      }) as unknown as Promise<LoanMetadataAccount>;
    },
    async updateLoan(_userId, loanId, data) {
      return prisma.loanAccount.update({
        where: { id: loanId },
        data,
        include: loanInclude,
      }) as unknown as Promise<LoanMetadataAccount>;
    },
    async updateProperty(_userId, propertyId, data) {
      return prisma.property.update({
        where: { id: propertyId },
        data,
      }) as unknown as Promise<LoanMetadataProperty>;
    },
  };
}

async function snapshot(userId: string, store: LoanMetadataStore) {
  const [loans, properties] = await Promise.all([store.listLoans(userId), store.listProperties(userId)]);
  return { loans: loans.map(toLoan), properties: properties.map(toProperty) };
}

export async function listLoanMetadata(
  context: AuthenticatedUserContext | null | undefined,
  store: LoanMetadataStore = createPrismaLoanMetadataStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  return snapshot(user.userId, store);
}

export async function createLoanAccount(
  context: AuthenticatedUserContext | null | undefined,
  input: LoanAccountCreateInput,
  store: LoanMetadataStore = createPrismaLoanMetadataStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const parsed = loanAccountCreateSchema.parse(input);
  const nickname = validateSafeNickname(parsed.nickname, "Loan nickname");
  let propertyId = parsed.propertyId ?? null;
  const newProperty = parsed.newProperty
    ? {
        nickname: validateSafeNickname(parsed.newProperty.nickname, "Property nickname"),
        usage: parsed.newProperty.usage,
      }
    : null;

  if (propertyId) {
    const property = await store.findProperty(user.userId, propertyId);
    assertUserOwnsRecord(user, property, "property");
    if (property.isArchived) throw new Error("Choose an active property.");
  }

  const loan = newProperty
    ? await store.createLoanWithProperty(user.userId, {
        nickname,
        type: parsed.choice.type,
        purpose: parsed.choice.purpose,
      }, newProperty)
    : await store.createLoan(user.userId, {
        nickname,
        type: parsed.choice.type,
        purpose: parsed.choice.purpose,
        propertyId,
      });
  assertUserOwnsRecord(user, loan, "loan account");
  return snapshot(user.userId, store);
}

export async function updateLoanAccount(
  context: AuthenticatedUserContext | null | undefined,
  loanId: string,
  input: LoanAccountUpdateInput,
  store: LoanMetadataStore = createPrismaLoanMetadataStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  const existing = await store.findLoan(user.userId, loanId);
  assertUserOwnsRecord(user, existing, "loan account");
  const parsed = loanAccountUpdateSchema.parse(input);
  const choice = parsed.choice ?? assertChoice(existing.type, existing.purpose);
  let propertyId = parsed.propertyId === undefined ? existing.propertyId ?? null : parsed.propertyId;

  if (choice.type !== "HOME_LOAN") propertyId = null;
  if (propertyId) {
    const property = await store.findProperty(user.userId, propertyId);
    assertUserOwnsRecord(user, property, "property");
    if (property.isArchived) throw new Error("Choose an active property.");
  }

  const archivedAt = parsed.isArchived === undefined ? undefined : parsed.isArchived ? now : null;
  const loan = await store.updateLoan(user.userId, loanId, {
    nickname: parsed.nickname ? validateSafeNickname(parsed.nickname, "Loan nickname") : undefined,
    type: choice.type,
    purpose: choice.purpose,
    propertyId,
    isArchived: parsed.isArchived,
    archivedAt,
  });
  assertUserOwnsRecord(user, loan, "loan account");
  return snapshot(user.userId, store);
}

export async function updatePropertyRecord(
  context: AuthenticatedUserContext | null | undefined,
  propertyId: string,
  input: PropertyUpdateInput,
  store: LoanMetadataStore = createPrismaLoanMetadataStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  const existing = await store.findProperty(user.userId, propertyId);
  assertUserOwnsRecord(user, existing, "property");
  const parsed = propertyUpdateSchema.parse(input);
  const archivedAt = parsed.isArchived === undefined ? undefined : parsed.isArchived ? now : null;
  const property = await store.updateProperty(user.userId, propertyId, {
    nickname: parsed.nickname ? validateSafeNickname(parsed.nickname, "Property nickname") : undefined,
    usage: parsed.usage,
    isArchived: parsed.isArchived,
    archivedAt,
  });
  assertUserOwnsRecord(user, property, "property");
  return snapshot(user.userId, store);
}
