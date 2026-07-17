import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  TransferLinkNotFoundError,
  TransferLinksUnavailableError,
  confirmTransferLink,
  confirmTransferLinkSchema,
  isEligibleTransferPair,
  unlinkTransferLink,
  type TransferLinkStore,
  type TransferRecord,
} from "@/src/server/transfer-links";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/transfer-links.ts", import.meta.url);
const createRoutePath = new URL("../../app/api/account/transfer-links/route.ts", import.meta.url);
const deleteRoutePath = new URL(
  "../../app/api/account/transfer-links/[linkId]/route.ts",
  import.meta.url,
);

function record(overrides: Partial<TransferRecord> = {}): TransferRecord {
  return {
    id: "transaction_out",
    amountCents: -12500,
    date: new Date("2026-07-15T00:00:00.000Z"),
    type: "TRANSFER",
    status: "ACTIVE",
    splitRole: "NONE",
    deletedAt: null,
    outgoingTransferLinks: [],
    incomingTransferLinks: [],
    ...overrides,
  };
}

function memoryStore(overrides: Partial<TransferLinkStore> = {}) {
  const confirmCalls: Array<{ userId: string; outgoingTransactionId: string; incomingTransactionId: string }> = [];
  const unlinkCalls: Array<{ userId: string; linkId: string }> = [];
  const store: TransferLinkStore = {
    async confirm(userId, input) {
      confirmCalls.push({ userId, ...input });
      return {
        id: "link_1",
        userId,
        ...input,
        confirmedAt: new Date("2026-07-17T00:00:00.000Z"),
        unlinkedAt: null,
      };
    },
    async unlink(userId, linkId, now) {
      unlinkCalls.push({ userId, linkId });
      return {
        id: linkId,
        userId,
        outgoingTransactionId: "transaction_out",
        incomingTransactionId: "transaction_in",
        confirmedAt: new Date("2026-07-17T00:00:00.000Z"),
        unlinkedAt: now,
      };
    },
    ...overrides,
  };
  return { store, confirmCalls, unlinkCalls };
}

describe("prepared durable transfer-link boundary", () => {
  it("fails closed before resolving or writing a transfer link", async () => {
    const confirm = vi.fn();
    const { store } = memoryStore({ confirm });

    await expect(confirmTransferLink(
      createTestUserContext("user_1"),
      {
        outgoingTransactionId: "transaction_out",
        incomingTransactionId: "transaction_in",
      },
      store,
    )).rejects.toBeInstanceOf(TransferLinksUnavailableError);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("requires two distinct opaque transaction IDs", () => {
    expect(confirmTransferLinkSchema.safeParse({
      outgoingTransactionId: "same",
      incomingTransactionId: "same",
    }).success).toBe(false);
  });

  it("accepts only exact opposite unsplit active transfers within two Australian days", () => {
    const outgoing = record();
    const incoming = record({
      id: "transaction_in",
      amountCents: 12500,
      date: new Date("2026-07-17T00:00:00.000Z"),
    });

    expect(isEligibleTransferPair(outgoing, incoming)).toBe(true);
    expect(isEligibleTransferPair(outgoing, {
      ...incoming,
      date: new Date("2026-07-18T00:00:00.000Z"),
    })).toBe(false);
    expect(isEligibleTransferPair(outgoing, {
      ...incoming,
      amountCents: 12499,
    })).toBe(false);
    expect(isEligibleTransferPair(outgoing, {
      ...incoming,
      splitRole: "CHILD",
    })).toBe(false);
    expect(isEligibleTransferPair(outgoing, {
      ...incoming,
      incomingTransferLinks: [{ id: "existing_link" }],
    })).toBe(false);
  });

  it("passes only the authenticated owner and returns safe lifecycle fields", async () => {
    const { store, confirmCalls } = memoryStore();
    const result = await confirmTransferLink(
      createTestUserContext("user_1"),
      {
        outgoingTransactionId: "transaction_out",
        incomingTransactionId: "transaction_in",
      },
      store,
      new Date("2026-07-17T00:00:00.000Z"),
      { runtimeEnabled: true },
    );

    expect(confirmCalls).toEqual([{
      userId: "user_1",
      outgoingTransactionId: "transaction_out",
      incomingTransactionId: "transaction_in",
    }]);
    expect(result).toEqual({
      id: "link_1",
      outgoingTransactionId: "transaction_out",
      incomingTransactionId: "transaction_in",
      confirmedAt: "2026-07-17T00:00:00.000Z",
      unlinkedAt: null,
    });
    expect(result).not.toHaveProperty("userId");
  });

  it("fails closed for a missing or non-owned unlink target", async () => {
    const { store } = memoryStore({
      async unlink() {
        return null;
      },
    });
    await expect(unlinkTransferLink(
      createTestUserContext("user_2"),
      "link_1",
      store,
      new Date(),
      { runtimeEnabled: true },
    )).rejects.toBeInstanceOf(TransferLinkNotFoundError);
  });

  it("keeps the routes authenticated, bounded and migration-gated", async () => {
    const [service, createRoute, deleteRoute] = await Promise.all([
      readFile(servicePath, "utf8"),
      readFile(createRoutePath, "utf8"),
      readFile(deleteRoutePath, "utf8"),
    ]);

    expect(service).toContain("TRANSFER_LINK_RUNTIME_ENABLED = false");
    expect(service).toContain("exactCandidates.length !== 1");
    expect(service).toContain("Prisma.TransactionIsolationLevel.Serializable");
    expect(service).not.toMatch(/description|merchantName|filename|accountNumber|bsb/i);
    expect(createRoute).toContain("getCurrentUserContext()");
    expect(createRoute).toContain("readBoundedJson");
    expect(createRoute).toContain("TransferLinksUnavailableError");
    expect(deleteRoute).toContain("getCurrentUserContext()");
    expect(deleteRoute).toContain("TransferLinksUnavailableError");
  });
});
