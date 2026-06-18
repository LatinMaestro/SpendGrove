import { ZodError } from "zod";
import { MerchantConflictError } from "@/src/server/merchant-rules";

const safeMessages = new Set([
  "Choose an approved category.",
  "Matching name must differ from the main merchant name.",
  "Another saved merchant already uses this name.",
  "This name is already used for matching another merchant.",
  "Choose an alias change before saving.",
  "Choose a rule change before saving.",
]);

export function safeMerchantRouteError(error: unknown) {
  if (error instanceof MerchantConflictError) {
    return { status: 409, body: { ok: false as const, error: error.message, conflict: error.conflict } };
  }
  if (error instanceof ZodError) {
    return { status: 400, body: { ok: false as const, error: error.issues[0]?.message ?? "Check the merchant details and try again." } };
  }
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return { status: 401, body: { ok: false as const, error: "Sign in to save merchant suggestions to your account." } };
    }
    if (error.name === "OwnershipError") {
      return { status: 404, body: { ok: false as const, error: "That saved merchant item could not be found for your account." } };
    }
    if (safeMessages.has(error.message) || /private banking identifiers|short cleaned merchant name/i.test(error.message)) {
      return { status: 400, body: { ok: false as const, error: error.message } };
    }
  }
  return { status: 400, body: { ok: false as const, error: "We could not update that merchant suggestion safely. Please try again." } };
}
