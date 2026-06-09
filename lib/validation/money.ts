import { z } from "zod";

export function parseMoneyToCents(input: string | number) {
  if (typeof input === "number" && !Number.isFinite(input)) {
    throw new Error("Money must be a finite AUD amount.");
  }

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

  const sign = normalized.startsWith("-") ? BigInt(-1) : BigInt(1);
  const unsigned = normalized.replace("-", "");
  const [dollars, cents = ""] = unsigned.split(".");
  const totalCents = sign * (BigInt(dollars) * BigInt(100) + BigInt(cents.padEnd(2, "0")));

  if (totalCents > BigInt(Number.MAX_SAFE_INTEGER) || totalCents < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error("Money amount exceeds the supported integer-cent range.");
  }

  return Number(totalCents);
}

export const centsSchema = z.number().int().finite().refine(Number.isSafeInteger, {
  message: "Amount must be a safe integer number of cents.",
});

export const nonZeroCentsSchema = centsSchema.refine((amountCents) => amountCents !== 0, {
  message: "Amount must not be zero cents.",
});

export const moneyInputToCentsSchema = z.union([z.string(), z.number()]).transform(parseMoneyToCents);
