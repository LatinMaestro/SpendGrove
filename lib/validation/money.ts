import { z } from "zod";

export function parseMoneyToCents(input: string | number) {
  const rawValue = String(input).trim();
  const isParenthesizedNegative = /^\(.+\)$/.test(rawValue);
  const withoutCurrency = rawValue
    .replace(/^AUD\s*/i, "")
    .replace(/[$,\s]/g, "")
    .replace(/[()]/g, "");

  const normalized = isParenthesizedNegative && !withoutCurrency.startsWith("-")
    ? `-${withoutCurrency}`
    : withoutCurrency;

  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Money must be a valid AUD amount with no more than two decimal places.");
  }

  const sign = normalized.startsWith("-") ? -1 : 1;
  const unsigned = normalized.replace("-", "");
  const [dollars, cents = ""] = unsigned.split(".");
  const paddedCents = cents.padEnd(2, "0");

  return sign * (Number.parseInt(dollars, 10) * 100 + Number.parseInt(paddedCents, 10));
}

export const centsSchema = z.number().int().finite();

export const nonZeroCentsSchema = centsSchema.refine((amountCents) => amountCents !== 0, {
  message: "Amount must not be zero cents.",
});

export const moneyInputToCentsSchema = z.union([z.string(), z.number()]).transform(parseMoneyToCents);
