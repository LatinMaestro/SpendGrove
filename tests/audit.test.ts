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
      metadata: { rawRow: "Account number 12345678" },
    })).toThrow();
  });
});
