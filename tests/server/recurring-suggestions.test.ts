import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  applyRecurringMutation,
  detectRecurringSuggestions,
  getRecurringSnapshot,
  recurringMutationSchema,
  type DbRecurringItem,
  type RecurringEvidenceRecord,
  type RecurringPersistenceStore,
} from "@/src/server/recurring-suggestions";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/recurring-suggestions.ts", import.meta.url);

function evidence(input: {
  id: string;
  date: string;
  userId?: string;
  amountCents?: number;
  type?: "EXPENSE" | "INCOME" | "TRANSFER";
  status?: string;
  splitRole?: string;
  deletedAt?: string | null;
  merchantProfileId?: string | null;
  merchantName?: string | null;
  categoryId?: string | null;
}): RecurringEvidenceRecord {
  const merchantProfileId = input.merchantProfileId === undefined ? "merchant_streaming" : input.merchantProfileId;
  const categoryId = input.categoryId === undefined ? "category_subscriptions" : input.categoryId;
  return {
    id: input.id,
    userId: input.userId ?? "user_1",
    date: input.date,
    amountCents: input.amountCents ?? -1599,
    type: input.type ?? "EXPENSE",
    status: input.status ?? "ACTIVE",
    splitRole: input.splitRole ?? "NONE",
    deletedAt: input.deletedAt ?? null,
    merchantProfileId,
    merchantName: input.merchantName ?? "Stream Service",
    categoryId,
    merchantProfile: merchantProfileId ? {
      id: merchantProfileId,
      userId: input.userId ?? "user_1",
      name: "Stream Service",
      isActive: true,
      deletedAt: null,
    } : null,
    category: categoryId ? {
      id: categoryId,
      userId: input.userId ?? "user_1",
      name: "Streaming / subscriptions",
      isArchived: false,
      deletedAt: null,
    } : null,
  };
}

function monthlyEvidence() {
  return [
    evidence({ id: "transaction_1", date: "2026-01-01T00:00:00.000Z" }),
    evidence({ id: "transaction_2", date: "2026-02-01T00:00:00.000Z" }),
    evidence({ id: "transaction_3", date: "2026-03-01T00:00:00.000Z" }),
  ];
}

function createMemoryStore(initialEvidence = monthlyEvidence()) {
  const evidenceRows = [...initialEvidence];
  const dismissed = new Set<string>();
  const items: DbRecurringItem[] = [];
  const audits: Array<Record<string, unknown>> = [];
  let itemSequence = 0;

  const store: RecurringPersistenceStore & {
    evidenceRows: RecurringEvidenceRecord[];
    dismissed: Set<string>;
    items: DbRecurringItem[];
    audits: Array<Record<string, unknown>>;
  } = {
    evidenceRows,
    dismissed,
    items,
    audits,
    async listEvidence(userId) {
      return evidenceRows.filter((row) => row.userId === userId);
    },
    async listDismissedKeys() {
      return [...dismissed];
    },
    async listItems(userId) {
      return items.filter((item) => item.userId === userId);
    },
    async confirm(userId, input, audit, now) {
      const existing = items.find((item) => (
        item.userId === userId
        && item.status === "ACTIVE"
        && item.categoryId === input.categoryId
        && item.transactionType === input.transactionType
        && item.expectedAmountCents === input.expectedAmountCents
        && item.cadence === input.cadence
        && item.label === input.label
      ));
      if (existing) return existing;
      itemSequence += 1;
      const created: DbRecurringItem = {
        id: `recurring_${itemSequence}`,
        userId,
        categoryId: input.categoryId,
        label: input.label,
        transactionType: input.transactionType,
        expectedAmountCents: input.expectedAmountCents,
        cadence: input.cadence,
        nextExpectedDate: input.nextExpectedDate,
        status: "ACTIVE",
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
        category: { name: "Streaming / subscriptions", isArchived: false, deletedAt: null },
      };
      items.push(created);
      audits.push({ ...audit, entityId: created.id });
      return created;
    },
    async dismiss(_userId, suggestionKey, audit) {
      if (dismissed.has(suggestionKey)) return;
      dismissed.add(suggestionKey);
      audits.push({ ...audit, entityId: "dismissal_1" });
    },
    async undoDismissal(_userId, suggestionKey, audit) {
      if (!dismissed.has(suggestionKey)) return false;
      dismissed.delete(suggestionKey);
      audits.push({ ...audit, entityId: "dismissal_1" });
      return true;
    },
    async update(userId, itemId, expectedUpdatedAt, input, audit) {
      const item = items.find((candidate) => (
        candidate.id === itemId
        && candidate.userId === userId
        && candidate.status === "ACTIVE"
        && new Date(candidate.updatedAt).getTime() === expectedUpdatedAt.getTime()
      ));
      if (!item) return null;
      Object.assign(item, input, { updatedAt: new Date("2026-07-10T01:00:00.000Z") });
      audits.push(audit);
      return item;
    },
    async archive(userId, itemId, expectedUpdatedAt, now, audit) {
      const item = items.find((candidate) => (
        candidate.id === itemId
        && candidate.userId === userId
        && candidate.status === "ACTIVE"
        && new Date(candidate.updatedAt).getTime() === expectedUpdatedAt.getTime()
      ));
      if (!item) return null;
      Object.assign(item, { status: "ARCHIVED", archivedAt: now, updatedAt: now });
      audits.push(audit);
      return item;
    },
    async restore(userId, itemId, expectedUpdatedAt, audit) {
      const item = items.find((candidate) => (
        candidate.id === itemId
        && candidate.userId === userId
        && candidate.status === "ARCHIVED"
        && new Date(candidate.updatedAt).getTime() === expectedUpdatedAt.getTime()
      ));
      if (!item) return null;
      const duplicate = items.some((candidate) => (
        candidate.id !== item.id
        && candidate.userId === userId
        && candidate.status === "ACTIVE"
        && candidate.label.trim().toLowerCase() === item.label.trim().toLowerCase()
      ));
      if (duplicate) throw new Error("An equivalent active recurring item already exists.");
      Object.assign(item, { status: "ACTIVE", archivedAt: null, updatedAt: new Date("2026-07-10T03:00:00.000Z") });
      audits.push(audit);
      return item;
    },
  };
  return store;
}

describe("deterministic recurring suggestions", () => {
  it("creates a high-confidence monthly suggestion from three exact safe matches", () => {
    const suggestions = detectRecurringSuggestions("user_1", monthlyEvidence());

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      label: "Stream Service",
      categoryLabel: "Streaming / subscriptions",
      expectedAmountCents: -1599,
      cadence: "MONTHLY",
      confidence: "HIGH",
      occurrenceCount: 3,
      nextExpectedDate: "2026-04-01",
    });
    expect(suggestions[0].key).toMatch(/^[a-f0-9]{64}$/);
  });

  it("creates a review suggestion from two exact fortnightly matches", () => {
    const suggestions = detectRecurringSuggestions("user_1", [
      evidence({ id: "transaction_1", date: "2026-01-01T00:00:00.000Z" }),
      evidence({ id: "transaction_2", date: "2026-01-15T00:00:00.000Z" }),
    ]);

    expect(suggestions).toMatchObject([{ cadence: "FORTNIGHTLY", confidence: "REVIEW", occurrenceCount: 2 }]);
  });

  it("does not suggest ambiguous intervals or merely similar amounts", () => {
    expect(detectRecurringSuggestions("user_1", [
      evidence({ id: "transaction_1", date: "2026-01-01T00:00:00.000Z" }),
      evidence({ id: "transaction_2", date: "2026-01-20T00:00:00.000Z" }),
      evidence({ id: "transaction_3", date: "2026-02-01T00:00:00.000Z" }),
    ])).toEqual([]);

    expect(detectRecurringSuggestions("user_1", [
      evidence({ id: "transaction_1", date: "2026-01-01T00:00:00.000Z", amountCents: -1599 }),
      evidence({ id: "transaction_2", date: "2026-02-01T00:00:00.000Z", amountCents: -1699 }),
      evidence({ id: "transaction_3", date: "2026-03-01T00:00:00.000Z", amountCents: -1599 }),
    ])).toEqual([]);
  });

  it("groups safe merchant names with changing trailing references", () => {
    const suggestions = detectRecurringSuggestions("user_1", [
      evidence({ id: "reference_1", date: "2026-01-01T00:00:00.000Z", merchantProfileId: null, merchantName: "Stream Service order 1001" }),
      evidence({ id: "reference_2", date: "2026-02-01T00:00:00.000Z", merchantProfileId: null, merchantName: "stream service ORDER-2002" }),
      evidence({ id: "reference_3", date: "2026-03-01T00:00:00.000Z", merchantProfileId: null, merchantName: "STREAM SERVICE order 3003" }),
    ]);

    expect(suggestions).toMatchObject([{
      label: "Stream Service",
      cadence: "MONTHLY",
      expectedAmountCents: -1599,
      occurrenceCount: 3,
    }]);
  });

  it("does not group unrelated or generic merchant identities", () => {
    expect(detectRecurringSuggestions("user_1", [
      evidence({ id: "generic_1", date: "2026-01-01T00:00:00.000Z", merchantProfileId: null, merchantName: "Payment 1001" }),
      evidence({ id: "generic_2", date: "2026-02-01T00:00:00.000Z", merchantProfileId: null, merchantName: "Payment 2002" }),
      evidence({ id: "generic_3", date: "2026-03-01T00:00:00.000Z", merchantProfileId: null, merchantName: "Payment 3003" }),
    ])).toEqual([]);

    expect(detectRecurringSuggestions("user_1", [
      evidence({ id: "different_1", date: "2026-01-01T00:00:00.000Z", merchantProfileId: null, merchantName: "Alpha Fitness ref 1001" }),
      evidence({ id: "different_2", date: "2026-02-01T00:00:00.000Z", merchantProfileId: null, merchantName: "Beta Fitness ref 2002" }),
      evidence({ id: "different_3", date: "2026-03-01T00:00:00.000Z", merchantProfileId: null, merchantName: "Gamma Fitness ref 3003" }),
    ])).toEqual([]);
  });

  it("excludes cross-user, deleted, split-parent, transfer and inactive evidence", () => {
    const excluded = [
      evidence({ id: "other_user", date: "2026-04-01T00:00:00.000Z", userId: "user_2" }),
      evidence({ id: "deleted", date: "2026-04-01T00:00:00.000Z", status: "DELETED", deletedAt: "2026-04-02T00:00:00.000Z" }),
      evidence({ id: "parent", date: "2026-04-01T00:00:00.000Z", splitRole: "PARENT" }),
      evidence({ id: "transfer", date: "2026-04-01T00:00:00.000Z", type: "TRANSFER" }),
      evidence({ id: "no_merchant", date: "2026-04-01T00:00:00.000Z", merchantProfileId: null, merchantName: "" }),
      {
        ...evidence({ id: "foreign_relation", date: "2026-04-01T00:00:00.000Z" }),
        merchantProfile: {
          ...evidence({ id: "merchant_helper", date: "2026-04-01T00:00:00.000Z" }).merchantProfile!,
          userId: "user_2",
        },
      },
    ];

    const suggestions = detectRecurringSuggestions("user_1", [
      ...monthlyEvidence(),
      ...excluded,
    ]);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].occurrenceCount).toBe(3);
  });
});

describe("recurring suggestion lifecycle", () => {
  it("requires confirmation before creating a durable item and is retry-safe", async () => {
    const store = createMemoryStore();
    const context = createTestUserContext("user_1");
    const initial = await getRecurringSnapshot(context, store);
    const suggestion = initial.suggestions[0];

    expect(store.items).toHaveLength(0);
    const request = {
      action: "CONFIRM",
      suggestionKey: suggestion.key,
      label: "My streaming plan",
      expectedAmountCents: suggestion.expectedAmountCents,
      cadence: suggestion.cadence,
      nextExpectedDate: suggestion.nextExpectedDate,
    } as const;

    const first = await applyRecurringMutation(context, request, store, new Date("2026-07-10T00:00:00.000Z"));
    const retry = await applyRecurringMutation(context, request, store, new Date("2026-07-10T00:01:00.000Z"));

    expect(first.suggestions).toHaveLength(0);
    expect(retry.suggestions).toHaveLength(0);
    expect(store.items).toHaveLength(1);
    expect(store.audits).toHaveLength(1);
    expect(store.audits[0]).toMatchObject({
      entityType: "RECURRING_ITEM",
      action: "CREATED",
      metadata: {
        reasonCode: "RECURRING_SUGGESTION_CONFIRMED",
        methodCode: "USER_CONFIRMED",
        confidenceCode: "HIGH",
      },
    });
  });

  it("keeps dismissed suggestions hidden without creating a recurring item", async () => {
    const store = createMemoryStore();
    const context = createTestUserContext("user_1");
    const suggestion = (await getRecurringSnapshot(context, store)).suggestions[0];

    const snapshot = await applyRecurringMutation(context, {
      action: "DISMISS",
      suggestionKey: suggestion.key,
    }, store);

    expect(snapshot.suggestions).toEqual([]);
    expect(snapshot.dismissedSuggestions).toMatchObject([{ key: suggestion.key }]);
    expect(store.items).toEqual([]);
    expect(store.dismissed).toContain(suggestion.key);
    expect(store.audits[0]).toMatchObject({
      entityType: "RECURRING_SUGGESTION_DISMISSAL",
      metadata: { reasonCode: "RECURRING_SUGGESTION_DISMISSED" },
    });

    const restored = await applyRecurringMutation(context, {
      action: "UNDO_DISMISSAL",
      suggestionKey: suggestion.key,
    }, store);

    expect(restored.dismissedSuggestions).toEqual([]);
    expect(restored.suggestions).toMatchObject([{ key: suggestion.key }]);
    expect(store.audits[1]).toMatchObject({
      entityType: "RECURRING_SUGGESTION_DISMISSAL",
      action: "DELETED",
      metadata: {
        reasonCode: "RECURRING_SUGGESTION_DISMISSAL_UNDONE",
        methodCode: "USER_UNDO",
      },
    });
    expect(JSON.stringify(store.audits[1])).not.toContain(suggestion.key);
  });

  it("supports safe edit, stale-edit rejection and archive", async () => {
    const store = createMemoryStore();
    const context = createTestUserContext("user_1");
    const suggestion = (await getRecurringSnapshot(context, store)).suggestions[0];
    let snapshot = await applyRecurringMutation(context, {
      action: "CONFIRM",
      suggestionKey: suggestion.key,
      label: suggestion.label,
      expectedAmountCents: suggestion.expectedAmountCents,
      cadence: suggestion.cadence,
      nextExpectedDate: suggestion.nextExpectedDate,
    }, store, new Date("2026-07-10T00:00:00.000Z"));
    const item = snapshot.items[0];

    snapshot = await applyRecurringMutation(context, {
      action: "UPDATE",
      itemId: item.id,
      updatedAt: item.updatedAt,
      label: "Edited recurring item",
      expectedAmountCents: -1600,
      cadence: "MONTHLY",
      nextExpectedDate: "2026-04-02",
    }, store);
    expect(snapshot.items[0]).toMatchObject({ label: "Edited recurring item", expectedAmountCents: -1600 });

    await expect(applyRecurringMutation(context, {
      action: "UPDATE",
      itemId: item.id,
      updatedAt: item.updatedAt,
      label: "Stale update",
      expectedAmountCents: -1600,
      cadence: "MONTHLY",
      nextExpectedDate: "2026-04-02",
    }, store)).rejects.toThrow(/changed since/i);

    const current = snapshot.items[0];
    snapshot = await applyRecurringMutation(context, {
      action: "ARCHIVE",
      itemId: current.id,
      updatedAt: current.updatedAt,
    }, store, new Date("2026-07-10T02:00:00.000Z"));
    expect(snapshot.items[0].status).toBe("ARCHIVED");

    const archived = snapshot.items[0];
    snapshot = await applyRecurringMutation(context, {
      action: "RESTORE",
      itemId: archived.id,
      updatedAt: archived.updatedAt,
    }, store, new Date("2026-07-10T03:00:00.000Z"));
    expect(snapshot.items[0]).toMatchObject({
      status: "ACTIVE",
      label: "Edited recurring item",
      expectedAmountCents: -1600,
      cadence: "MONTHLY",
      nextExpectedDate: "2026-04-02",
    });
    expect(store.audits.at(-1)).toMatchObject({
      entityType: "RECURRING_ITEM",
      action: "UPDATED",
      metadata: {
        reasonCode: "RECURRING_ITEM_RESTORED",
        stateCode: "ACTIVE",
      },
    });
  });

  it("rejects stale, cross-user and duplicate-active recurring restores", async () => {
    const store = createMemoryStore();
    const context = createTestUserContext("user_1");
    const suggestion = (await getRecurringSnapshot(context, store)).suggestions[0];
    let snapshot = await applyRecurringMutation(context, {
      action: "CONFIRM",
      suggestionKey: suggestion.key,
      label: suggestion.label,
      expectedAmountCents: suggestion.expectedAmountCents,
      cadence: suggestion.cadence,
      nextExpectedDate: suggestion.nextExpectedDate,
    }, store, new Date("2026-07-10T00:00:00.000Z"));
    const active = snapshot.items[0];
    snapshot = await applyRecurringMutation(context, {
      action: "ARCHIVE",
      itemId: active.id,
      updatedAt: active.updatedAt,
    }, store, new Date("2026-07-10T01:00:00.000Z"));
    const archived = snapshot.items[0];

    await expect(applyRecurringMutation(context, {
      action: "RESTORE",
      itemId: archived.id,
      updatedAt: "2026-07-09T00:00:00.000Z",
    }, store)).rejects.toThrow(/changed since/i);

    await expect(applyRecurringMutation(createTestUserContext("user_2"), {
      action: "RESTORE",
      itemId: archived.id,
      updatedAt: archived.updatedAt,
    }, store)).rejects.toThrow(/changed since/i);

    store.items.push({
      ...store.items[0],
      id: "recurring_duplicate",
      status: "ACTIVE",
      archivedAt: null,
      updatedAt: "2026-07-10T02:00:00.000Z",
    });
    await expect(applyRecurringMutation(context, {
      action: "RESTORE",
      itemId: archived.id,
      updatedAt: archived.updatedAt,
    }, store)).rejects.toThrow(/equivalent active recurring item/i);
  });

  it("rejects private identifiers in user-confirmed labels", () => {
    expect(() => recurringMutationSchema.parse({
      action: "CONFIRM",
      suggestionKey: "a".repeat(64),
      label: "Account number 12345678",
      expectedAmountCents: -1599,
      cadence: "MONTHLY",
      nextExpectedDate: "2026-04-01",
    })).toThrow(/private banking identifiers/i);
  });

  it("selects only safe structured evidence and never reads analytical repayment records", async () => {
    const service = await readFile(servicePath, "utf8");
    const evidenceSelect = service.match(/select: \{\n          id: true,[\s\S]*?orderBy: \[\{ date: "asc"/)?.[0] ?? "";

    expect(evidenceSelect).toContain("merchantProfileId: true");
    expect(evidenceSelect).toContain("categoryId: true");
    expect(evidenceSelect).toContain("amountCents: true");
    expect(evidenceSelect).not.toMatch(/description|narration|fileName|accountNumber|balance/i);
    expect(service).not.toMatch(/loanRepayment\.(?:find|count|aggregate)/);
    expect(service).toContain('splitRole: { not: "PARENT" }');
  });
});
