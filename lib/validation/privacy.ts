const privateBankPatterns = [
  /\bBSB\s*[:#-]?\s*\d{3}[-\s]?\d{3}\b/i,
  /\b(?:account|acct|loan|customer|client|member)\s*(?:number|no|id)?\s*[:#-]?\s*\d{4,}\b/i,
  /\b(?:card)\s*(?:number|no)?\s*[:#-]?\s*(?:\d[\s-]?){8,}\b/i,
  /\b(?:xx|x{2,})\d{3,6}\b/i,
];

const safeReplacement = "[private field removed]";

export function containsPrivateBankIdentifier(value: string) {
  return privateBankPatterns.some((pattern) => pattern.test(value));
}

export function redactPrivateBankTokens(value: string) {
  return privateBankPatterns.reduce((current, pattern) => current.replace(pattern, safeReplacement), value);
}

export function assertNoPrivateBankIdentifiers(value: string, fieldName: string) {
  if (containsPrivateBankIdentifier(value)) {
    throw new Error(`${fieldName} contains a private bank identifier and must be redacted before storage.`);
  }
}

export function normalizeSafeText(value: string) {
  return redactPrivateBankTokens(value).replace(/\s+/g, " ").trim();
}

export function assertSafeJson(value: unknown, fieldName = "metadata") {
  const inspect = (input: unknown, path: string): void => {
    if (typeof input === "string") {
      assertNoPrivateBankIdentifiers(input, path);
      return;
    }

    if (Array.isArray(input)) {
      input.forEach((item, index) => inspect(item, `${path}[${index}]`));
      return;
    }

    if (input && typeof input === "object") {
      Object.entries(input as Record<string, unknown>).forEach(([key, nestedValue]) => {
        assertNoPrivateBankIdentifiers(key, `${path}.${key}`);
        inspect(nestedValue, `${path}.${key}`);
      });
    }
  };

  inspect(value, fieldName);
  return value;
}
