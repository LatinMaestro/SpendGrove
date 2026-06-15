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

  it("keeps card merchant titles short while retaining safe bank detail separately", () => {
    const sevenEleven = "7-ELEVEN 4235 Fictional Suburb QL AUS Card Value Date: 27/05/2026";
    const dominos = "Domino's Estore Fictional Suburb dominos.com.au AU AUS Card Value Date: 27/05/2026";

    expect(sanitizeTransactionNarration(sevenEleven)).toBe("7-ELEVEN");
    expect(sanitizeTransactionNarration(dominos)).toBe("Domino's");
    expect(sanitizeBankDescription(sevenEleven)).toBe("7-ELEVEN 4235 Fictional Suburb QL AUS");
    expect(sanitizeBankDescription(dominos)).toBe("Domino's Estore Fictional Suburb dominos.com.au AU AUS");
    expect(sanitizeTransactionNarration(sevenEleven)).not.toContain("4235");
    expect(sanitizeTransactionNarration(sevenEleven)).not.toContain("Card Value Date");
    expect(sanitizeTransactionNarration(dominos)).not.toContain("Fictional Suburb");
    expect(sanitizeTransactionNarration(dominos)).not.toContain("dominos.com.au");
  });

  it.each([
    ["Woolworths Metro Fictional Suburb QL AUS Card Value Date: 27/05/2026", "Woolworths"],
    ["Coles Fictional Store NSW AUS Card Value Date: 27/05/2026", "Coles"],
    ["Bunnings Warehouse Fictional Suburb AU AUS Card Value Date: 27/05/2026", "Bunnings"],
  ])("uses a short known merchant title for %s", (input, expected) => {
    const title = sanitizeTransactionNarration(input);
    expect(title).toBe(expected);
    expect(title).not.toContain("Card Value Date");
    expect(title).not.toContain("Fictional");
    expect(title).not.toContain("AUS");
  });

  it("removes long references and private fragments from fuller bank detail", () => {
    const description = sanitizeBankDescription("Direct Debit PayPal customer ID 12345678 reference 9988776655 card xx4321");
    expect(description).toBe("Direct Debit PayPal");
    expect(description).not.toContain("12345678");
    expect(description).not.toContain("9988776655");
    expect(description).not.toContain("4321");
  });
});
