import { describe, expect, it } from "vitest";
import {
  sanitizeBankDescription,
  sanitizeTransactionNarration,
} from "@/lib/validation/privacy";

describe("safe transaction names and bank descriptions", () => {
  it("shows PayPal for a PayPal direct debit", () => {
    const input = "Direct Debit PayPal reference 987654321";
    expect(sanitizeTransactionNarration(input)).toBe("PayPal");
    expect(sanitizeBankDescription(input)).toBe("Direct Debit PayPal");
  });

  it("extracts a clear direct-debit merchant before falling back to Payment", () => {
    expect(sanitizeTransactionNarration("Direct Debit Bright Energy reference 987654321")).toBe("Bright Energy");
    expect(sanitizeTransactionNarration("Payment reference 987654321")).toBe("Payment");
  });

  it("keeps a safe first-name context for recipient transfers", () => {
    const input = "Transfer to Alex Recipient account 12345678 reference 987654321";
    expect(sanitizeTransactionNarration(input)).toBe("Bank transfer to Alex");
    expect(sanitizeBankDescription(input)).toBe("Bank transfer to Alex");
  });

  it("removes long references and private fragments from fuller bank detail", () => {
    const description = sanitizeBankDescription("Direct Debit PayPal customer ID 12345678 reference 9988776655 card xx4321");
    expect(description).toBe("Direct Debit PayPal");
    expect(description).not.toContain("12345678");
    expect(description).not.toContain("9988776655");
    expect(description).not.toContain("4321");
  });
});
