import { describe, expect, it } from "vitest";
import { AuthenticationRequiredError, OwnershipError } from "@/src/server/auth/ownership";
import {
  createLoanAccount,
  listLoanMetadata,
  updateLoanAccount,
  updatePropertyRecord,
  type LoanMetadataAccount,
  type LoanMetadataProperty,
  type LoanMetadataStore,
} from "@/src/server/loan-metadata";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

function memoryStore() {
  const loans: LoanMetadataAccount[] = [];
  const properties: LoanMetadataProperty[] = [];
  let nextId = 1;
  const now = new Date("2026-06-22T00:00:00.000Z");

  const store: LoanMetadataStore & {
    loans: LoanMetadataAccount[];
    properties: LoanMetadataProperty[];
  } = {
    loans,
    properties,
    async listLoans(userId) {
      return loans.filter((loan) => loan.userId === userId);
    },
    async listProperties(userId) {
      return properties.filter((property) => property.userId === userId);
    },
    async findLoan(userId, loanId) {
      return loans.find((loan) => loan.userId === userId && loan.id === loanId) ?? null;
    },
    async findProperty(userId, propertyId) {
      return properties.find((property) => property.userId === userId && property.id === propertyId) ?? null;
    },
    async createProperty(userId, data) {
      const property: LoanMetadataProperty = {
        id: `property_${nextId++}`,
        userId,
        ...data,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };
      properties.push(property);
      return property;
    },
    async createLoan(userId, data) {
      const loan: LoanMetadataAccount = {
        id: `loan_${nextId++}`,
        userId,
        ...data,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
        property: data.propertyId
          ? properties.find((property) => property.id === data.propertyId) ?? null
          : null,
      };
      loans.push(loan);
      return loan;
    },
    async createLoanWithProperty(userId, loanData, propertyData) {
      const property = await store.createProperty(userId, propertyData);
      return store.createLoan(userId, { ...loanData, propertyId: property.id });
    },
    async updateLoan(userId, loanId, data) {
      const loan = loans.find((candidate) => candidate.userId === userId && candidate.id === loanId);
      if (!loan) throw new Error("record not found");
      Object.assign(loan, data, {
        property: data.propertyId
          ? properties.find((property) => property.id === data.propertyId) ?? null
          : data.propertyId === null ? null : loan.property,
        updatedAt: now,
      });
      return loan;
    },
    async updateProperty(userId, propertyId, data) {
      const property = properties.find((candidate) => candidate.userId === userId && candidate.id === propertyId);
      if (!property) throw new Error("record not found");
      Object.assign(property, data, { updatedAt: now });
      loans.filter((loan) => loan.userId === userId && loan.propertyId === propertyId).forEach((loan) => {
        loan.property = property;
      });
      return property;
    },
  };

  return store;
}

const ownerOccupied = {
  kind: "OWNER_OCCUPIER_HOME" as const,
  type: "HOME_LOAN" as const,
  purpose: "OWNER_OCCUPIER" as const,
};

describe("Loans-first durable metadata", () => {
  it("creates every approved loan type and keeps property optional", async () => {
    const user = createTestUserContext("user_1");
    const store = memoryStore();

    await createLoanAccount(user, { nickname: "Family home", choice: ownerOccupied }, store);
    await createLoanAccount(user, {
      nickname: "Rental loan",
      choice: { kind: "INVESTMENT_PROPERTY", type: "HOME_LOAN", purpose: "INVESTMENT" },
      newProperty: { nickname: "Rental unit", usage: "INVESTMENT" },
    }, store);
    await createLoanAccount(user, {
      nickname: "Family car",
      choice: { kind: "CAR", type: "CAR_LOAN", purpose: "PERSONAL" },
    }, store);
    await createLoanAccount(user, {
      nickname: "Personal loan",
      choice: { kind: "PERSONAL", type: "PERSONAL_LOAN", purpose: "PERSONAL" },
    }, store);
    await createLoanAccount(user, {
      nickname: "Other lending",
      choice: { kind: "OTHER", type: "OTHER", purpose: "OTHER" },
    }, store);

    const result = await listLoanMetadata(user, store);
    expect(result.loans).toHaveLength(5);
    expect(result.properties).toHaveLength(1);
    expect(result.loans.find((loan) => loan.type === "CAR_LOAN")?.property).toBeNull();
    expect(result.loans.find((loan) => loan.purpose === "INVESTMENT")?.property?.nickname).toBe("Rental unit");
  });

  it("does not allow a property on car, personal or other loans", async () => {
    const user = createTestUserContext("user_1");
    const store = memoryStore();

    await expect(createLoanAccount(user, {
      nickname: "Car loan",
      choice: { kind: "CAR", type: "CAR_LOAN", purpose: "PERSONAL" },
      newProperty: { nickname: "Not allowed", usage: "OTHER" },
    }, store)).rejects.toThrow(/property is optional only/i);
  });

  it("edits and archives user-owned loan and property records", async () => {
    const user = createTestUserContext("user_1");
    const store = memoryStore();
    const created = await createLoanAccount(user, {
      nickname: "Home loan",
      choice: ownerOccupied,
      newProperty: { nickname: "Family home", usage: "OWNER_OCCUPIED" },
    }, store);
    const loan = created.loans[0];
    const property = created.properties[0];

    const updated = await updateLoanAccount(user, loan.id, { nickname: "Main home loan", isArchived: true }, store);
    expect(updated.loans[0]).toMatchObject({ nickname: "Main home loan", isArchived: true });

    const propertyUpdated = await updatePropertyRecord(user, property.id, {
      nickname: "Our home",
      usage: "OWNER_OCCUPIED",
      isArchived: true,
    }, store);
    expect(propertyUpdated.properties[0]).toMatchObject({ nickname: "Our home", isArchived: true });
  });

  it("rejects private identifiers and cross-user links before writes", async () => {
    const userOne = createTestUserContext("user_1");
    const userTwo = createTestUserContext("user_2");
    const store = memoryStore();
    const created = await createLoanAccount(userOne, {
      nickname: "Rental loan",
      choice: ownerOccupied,
      newProperty: { nickname: "Rental unit", usage: "INVESTMENT" },
    }, store);

    await expect(createLoanAccount(userOne, {
      nickname: "Account 12345678",
      choice: ownerOccupied,
    }, store)).rejects.toThrow(/private bank identifier/i);

    await expect(createLoanAccount(userTwo, {
      nickname: "Other user loan",
      choice: ownerOccupied,
      propertyId: created.properties[0].id,
    }, store)).rejects.toThrow(OwnershipError);
  });

  it("requires authentication before store access", async () => {
    const store = memoryStore();
    await expect(listLoanMetadata(null, store)).rejects.toThrow(AuthenticationRequiredError);
    await expect(createLoanAccount(undefined, { nickname: "Loan", choice: ownerOccupied }, store)).rejects.toThrow(AuthenticationRequiredError);
    expect(store.loans).toEqual([]);
  });
});
