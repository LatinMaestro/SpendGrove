import { describe, expect, it } from "vitest";
import { AuthenticationRequiredError, OwnershipError } from "@/src/server/auth/ownership";
import {
  createDurableCustomCategory,
  listDurableCustomCategories,
  migrateDurableCustomCategories,
  updateDurableCustomCategory,
  type CustomCategoryPersistenceStore,
  type DbCustomCategoryRecord,
} from "@/src/server/custom-categories";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

function createMemoryStore() {
  const records: DbCustomCategoryRecord[] = [];
  let nextGroupId = 1;

  function activeRecords(userId: string) {
    return records.filter((record) => record.userId === userId && !record.deletedAt);
  }

  const store: CustomCategoryPersistenceStore & {
    records: DbCustomCategoryRecord[];
    addSeeded(userId: string, id: string, name: string): void;
  } = {
    records,
    addSeeded(userId, id, name) {
      const now = new Date("2026-06-18T00:00:00.000Z");
      records.push({
        id,
        userId,
        name,
        type: "EXPENSE",
        isSeeded: true,
        isArchived: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
        parent: null,
      });
    },
    async listCustom(userId) {
      return activeRecords(userId).filter((record) => !record.isSeeded);
    },
    async listOwnedNames(userId) {
      return activeRecords(userId).map(({ id, name }) => ({ id, name }));
    },
    async findCustomById(userId, categoryId) {
      return activeRecords(userId).find((record) => record.id === categoryId && !record.isSeeded) ?? null;
    },
    async ensureGroup(userId, group) {
      const existing = activeRecords(userId).find((record) => record.isSeeded && record.name === group);
      if (existing) return existing.id;
      const id = `group_${nextGroupId++}`;
      store.addSeeded(userId, id, group);
      return id;
    },
    async create(userId, input) {
      const now = new Date("2026-06-18T00:00:00.000Z");
      const record: DbCustomCategoryRecord = {
        id: input.id,
        userId,
        name: input.name,
        type: input.type,
        isSeeded: false,
        isArchived: input.isArchived,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
        parent: { name: input.group },
      };
      records.push(record);
      return record;
    },
    async update(userId, categoryId, input) {
      const record = activeRecords(userId).find((candidate) => candidate.id === categoryId && !candidate.isSeeded);
      if (!record) throw new Error("record not found");
      Object.assign(record, input, { updatedAt: new Date("2026-06-19T00:00:00.000Z") });
      return record;
    },
  };

  return store;
}

const workParking = {
  id: "custom-category-work-parking",
  name: "Work parking",
  group: "Work and tax" as const,
  type: "EXPENSE" as const,
};

describe("durable custom categories", () => {
  it("creates, lists, renames, archives and restores user-owned categories", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();

    const created = await createDurableCustomCategory(user, workParking, store);
    expect(created).toMatchObject({
      id: workParking.id,
      name: "Work parking",
      group: "Work and tax",
      type: "EXPENSE",
      isArchived: false,
    });
    expect(await listDurableCustomCategories(user, store)).toHaveLength(1);

    const renamed = await updateDurableCustomCategory(user, created.id, { name: "Client parking" }, store);
    expect(renamed.name).toBe("Client parking");

    const archived = await updateDurableCustomCategory(user, created.id, { isArchived: true }, store);
    expect(archived.isArchived).toBe(true);

    const restored = await updateDurableCustomCategory(user, created.id, { isArchived: false }, store);
    expect(restored.isArchived).toBe(false);
  });

  it("prevents case-insensitive duplicates across seeded and custom categories", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();
    store.addSeeded(user.userId, "seeded_groceries", "Groceries");

    await expect(createDurableCustomCategory(user, {
      ...workParking,
      id: "custom-category-groceries-copy",
      name: "  groceries  ",
    }, store)).rejects.toThrow(/already exists/i);

    await createDurableCustomCategory(user, workParking, store);
    await expect(createDurableCustomCategory(user, {
      ...workParking,
      id: "custom-category-work-parking-copy",
      name: "WORK PARKING",
    }, store)).rejects.toThrow(/already exists/i);
  });

  it("keeps seeded categories immutable and blocks cross-user access", async () => {
    const userOne = createTestUserContext("user_1");
    const userTwo = createTestUserContext("user_2");
    const store = createMemoryStore();
    store.addSeeded(userOne.userId, "seeded_groceries", "Groceries");
    const created = await createDurableCustomCategory(userOne, workParking, store);

    await expect(updateDurableCustomCategory(userOne, "seeded_groceries", { name: "Changed" }, store)).rejects.toThrow(OwnershipError);
    await expect(updateDurableCustomCategory(userTwo, created.id, { isArchived: true }, store)).rejects.toThrow(OwnershipError);
    expect(await listDurableCustomCategories(userTwo, store)).toEqual([]);
  });

  it("requires authenticated user context before any category store access", async () => {
    const store = createMemoryStore();

    await expect(listDurableCustomCategories(null, store)).rejects.toThrow(AuthenticationRequiredError);
    await expect(createDurableCustomCategory(undefined, workParking, store)).rejects.toThrow(AuthenticationRequiredError);
    expect(store.records).toEqual([]);
  });

  it("migrates only user-confirmed safe local categories and skips existing matches", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();
    await createDurableCustomCategory(user, workParking, store);

    const result = await migrateDurableCustomCategories(user, [
      workParking,
      {
        id: "custom-category-kids-sport",
        name: "Kids sport",
        group: "Everyday spending",
        type: "EXPENSE",
        isArchived: true,
      },
    ], store);

    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.categories).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Work parking" }),
      expect.objectContaining({ name: "Kids sport", isArchived: true }),
    ]));
  });

  it("rejects private banking identifiers before durable storage", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();

    await expect(createDurableCustomCategory(user, {
      ...workParking,
      id: "custom-category-private-reference",
      name: "Account 12345678",
    }, store)).rejects.toThrow(/private bank identifier/i);
    expect(store.records).toEqual([]);
  });
});
