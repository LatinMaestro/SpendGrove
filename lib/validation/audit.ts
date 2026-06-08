import { z } from "zod";
import { auditActionSchema, auditEntityTypeSchema } from "@/lib/validation/enums";
import { assertSafeJson } from "@/lib/validation/privacy";

export const auditMetadataSchema = z.unknown().optional().transform((value) => {
  if (value === undefined) return undefined;
  return assertSafeJson(value, "audit.metadata");
});

export const auditEventSchema = z.object({
  userId: z.string().min(1),
  entityType: auditEntityTypeSchema,
  entityId: z.string().min(1).optional(),
  action: auditActionSchema,
  metadata: auditMetadataSchema,
});
