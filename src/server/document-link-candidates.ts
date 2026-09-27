import { type PrismaClient } from "@prisma/client";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import type { DocumentLinkTargetType } from "@/src/server/documents";
import { isVerifiedPreviewRuntime } from "@/src/server/preview-runtime";

export type DocumentLinkCandidate = {
  targetType: DocumentLinkTargetType;
  targetKey: string;
  targetEntityId: string | null;
  title: string;
  detail: string;
};

export type DocumentLinkCandidateStore = {
  list(userId: string): Promise<DocumentLinkCandidate[]>;
};

export class DocumentLinkCandidatesUnavailableError extends Error {
  constructor() {
    super("Document links are available only in the verified Preview environment.");
    this.name = "DocumentLinkCandidatesUnavailableError";
  }
}

function dateKey(value: Date | string) {
  return (value instanceof Date ? value : new Date(value)).toISOString().slice(0, 10);
}

export function createPrismaDocumentLinkCandidateStore(
  prisma: PrismaClient = getPrismaClient(),
): DocumentLinkCandidateStore {
  return {
    async list(userId) {
      const [transactions, properties, loans, repayments, imports] = await prisma.$transaction([
        prisma.transaction.findMany({
          where: {
            userId,
            status: "ACTIVE",
            deletedAt: null,
            splitRole: { not: "PARENT" },
          },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          take: 50,
          select: {
            id: true,
            date: true,
            type: true,
            category: { select: { name: true } },
          },
        }),
        prisma.property.findMany({
          where: { userId, isArchived: false, deletedAt: null },
          orderBy: { nickname: "asc" },
          select: { id: true, nickname: true },
        }),
        prisma.loanAccount.findMany({
          where: { userId, isArchived: false, deletedAt: null },
          orderBy: { nickname: "asc" },
          select: { id: true, nickname: true },
        }),
        prisma.loanRepayment.findMany({
          where: { userId, isArchived: false, deletedAt: null },
          orderBy: { repaymentDate: "desc" },
          take: 50,
          select: { id: true, repaymentDate: true },
        }),
        prisma.importBatch.findMany({
          where: { userId, status: "COMPLETED", deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { id: true, createdAt: true, type: true },
        }),
      ]);
      return [
        ...transactions.map((record) => ({
          targetType: "TRANSACTION" as const,
          targetKey: `TRANSACTION:${record.id}`,
          targetEntityId: record.id,
          title: record.category?.name ?? (record.type === "INCOME" ? "Money in" : record.type === "TRANSFER" ? "Transfer" : "Money out"),
          detail: dateKey(record.date),
        })),
        ...properties.map((record) => ({
          targetType: "PROPERTY" as const,
          targetKey: `PROPERTY:${record.id}`,
          targetEntityId: record.id,
          title: record.nickname,
          detail: "Property",
        })),
        ...loans.map((record) => ({
          targetType: "LOAN_ACCOUNT" as const,
          targetKey: `LOAN_ACCOUNT:${record.id}`,
          targetEntityId: record.id,
          title: record.nickname,
          detail: "Loan",
        })),
        ...repayments.map((record) => ({
          targetType: "LOAN_REPAYMENT" as const,
          targetKey: `LOAN_REPAYMENT:${record.id}`,
          targetEntityId: record.id,
          title: `Loan repayment · ${dateKey(record.repaymentDate)}`,
          detail: "Repayment",
        })),
        ...imports.map((record) => ({
          targetType: "IMPORT_BATCH" as const,
          targetKey: `IMPORT_BATCH:${record.id}`,
          targetEntityId: record.id,
          title: `Import · ${dateKey(record.createdAt)}`,
          detail: record.type === "LOAN_CSV" ? "Loan import" : "Transaction import",
        })),
        ...[
          ["monthly", "Monthly spending report"],
          ["loan", "Loan report"],
          ["property", "Property report"],
          ["accountant-pack", "Accountant record pack"],
        ].map(([targetKey, title]) => ({
          targetType: "REPORT" as const,
          targetKey,
          targetEntityId: null,
          title,
          detail: "Report",
        })),
      ];
    },
  };
}

type RuntimeOptions = { runtimeEnabled?: boolean };

export async function listDocumentLinkCandidates(
  context: AuthenticatedUserContext | null | undefined,
  store: DocumentLinkCandidateStore = createPrismaDocumentLinkCandidateStore(),
  options: RuntimeOptions = {},
) {
  if (!(options.runtimeEnabled ?? isVerifiedPreviewRuntime())) {
    throw new DocumentLinkCandidatesUnavailableError();
  }
  const user = requireAuthenticatedUserContext(context);
  return store.list(user.userId);
}
