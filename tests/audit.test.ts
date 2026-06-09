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
