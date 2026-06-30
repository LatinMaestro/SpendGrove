import { describe, expect, it } from "vitest";
import { auditEventSchema } from "@/lib/validation/audit";

describe("audit validation", () => {
  it("accepts safe audit metadata", () => {
    const event = auditEventSchema.parse({
      userId: "user_1",
      entityType: "IMPORT_BATCH",
      action: "PRIVACY_FIELDS_EXCLUDED",
      metadata: { privateFieldCount: 2, excludedHeaders: ["BSB", "Account Number"] },
    });

    expect(event.action).toBe("PRIVACY_FIELDS_EXCLUDED");
  });

  it("accepts Phase 3B audit entities with privacy-safe state and decision codes", () => {
    for (const event of [
      { entityType: "PROPERTY", entityId: "property_1", action: "UPDATED", metadata: { stateCode: "ACTIVE" } },
      { entityType: "LOAN_ACCOUNT", entityId: "loan_1", action: "ARCHIVED", metadata: { stateCode: "ARCHIVED" } },
      { entityType: "LOAN_REPAYMENT", entityId: "repayment_1", action: "ARCHIVED", metadata: { stateCode: "ARCHIVED" } },
      {
        entityType: "LOAN_RECONCILIATION_LINK",
        entityId: "link_1",
        action: "CREATED",
        metadata: { methodCode: "MANUAL", confidenceCode: "MANUAL", reasonCode: "MANUAL_OVERRIDE" },
      },
    ] as const) {
      expect(auditEventSchema.parse({ userId: "user_1", ...event })).toMatchObject(event);
      expect(Object.keys(event.metadata)).not.toEqual(expect.arrayContaining(["amountCents", "balanceAfterCents", "rawNarration"]));
    }
  });

  it("rejects private bank values in audit metadata", () => {
    expect(() => auditEventSchema.parse({
      userId: "user_1",
      entityType: "IMPORT_BATCH",
      action: "UPDATED",
      metadata: { note: "Account number 12345678" },
    })).toThrow();
  });

  it("rejects raw row fields even when their example value looks harmless", () => {
    expect(() => auditEventSchema.parse({
      userId: "user_1",
      entityType: "IMPORT_ROW",
      action: "REVIEWED",
      metadata: { rawRow: "synthetic-looking value" },
    })).toThrow();
  });
});
