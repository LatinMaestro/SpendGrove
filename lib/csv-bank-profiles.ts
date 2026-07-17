export type EverydayBankSupportStatus = "CONFIRMED_PROFILE" | "GENERIC_ONLY";

export type ConfirmedEverydayCsvProfile = {
  id: string;
  bankId: string;
  bankName: string;
  displayName: string;
  requiredHeaders: readonly string[];
  optionalHeaders: readonly string[];
  amountMode: "SIGNED_AMOUNT" | "DEBIT_CREDIT";
  fixtureIds: readonly string[];
};

export type EverydayBankFormatEntry = {
  bankId: string;
  bankName: string;
  aliases: readonly string[];
  supportStatus: EverydayBankSupportStatus;
  profiles: readonly ConfirmedEverydayCsvProfile[];
};

const profile = (value: ConfirmedEverydayCsvProfile) => value;

export const everydayBankFormatRegister: readonly EverydayBankFormatEntry[] = [
  {
    bankId: "commbank",
    bankName: "Commonwealth Bank",
    aliases: ["CommBank", "CBA"],
    supportStatus: "CONFIRMED_PROFILE",
    profiles: [profile({
      id: "commbank-everyday-v1",
      bankName: "Commonwealth Bank",
      bankId: "commbank",
      displayName: "CommBank transaction CSV",
      requiredHeaders: ["date", "amount", "description", "account number"],
      optionalHeaders: ["balance"],
      amountMode: "SIGNED_AMOUNT",
      fixtureIds: ["commbank-everyday.csv"],
    })],
  },
  {
    bankId: "anz",
    bankName: "ANZ",
    aliases: ["Australia and New Zealand Banking Group"],
    supportStatus: "CONFIRMED_PROFILE",
    profiles: [profile({
      id: "anz-everyday-v1",
      bankName: "ANZ",
      bankId: "anz",
      displayName: "ANZ transaction CSV",
      requiredHeaders: ["date", "amount", "details"],
      optionalHeaders: ["type", "balance"],
      amountMode: "SIGNED_AMOUNT",
      fixtureIds: ["anz-everyday.csv"],
    })],
  },
  {
    bankId: "nab",
    bankName: "NAB",
    aliases: ["National Australia Bank"],
    supportStatus: "CONFIRMED_PROFILE",
    profiles: [profile({
      id: "nab-everyday-v1",
      bankName: "NAB",
      bankId: "nab",
      displayName: "NAB transaction CSV",
      requiredHeaders: ["date", "amount", "transaction details"],
      optionalHeaders: ["balance"],
      amountMode: "SIGNED_AMOUNT",
      fixtureIds: ["nab-everyday.csv"],
    })],
  },
  {
    bankId: "westpac",
    bankName: "Westpac",
    aliases: [],
    supportStatus: "CONFIRMED_PROFILE",
    profiles: [profile({
      id: "westpac-everyday-v1",
      bankName: "Westpac",
      bankId: "westpac",
      displayName: "Westpac transaction CSV",
      requiredHeaders: ["date", "narrative", "debit amount", "credit amount"],
      optionalHeaders: ["balance"],
      amountMode: "DEBIT_CREDIT",
      fixtureIds: ["westpac-split-amounts.csv"],
    })],
  },
  { bankId: "macquarie", bankName: "Macquarie", aliases: ["Macquarie Bank"], supportStatus: "GENERIC_ONLY", profiles: [] },
  { bankId: "ing", bankName: "ING", aliases: ["ING Australia"], supportStatus: "GENERIC_ONLY", profiles: [] },
  { bankId: "bankwest", bankName: "Bankwest", aliases: [], supportStatus: "GENERIC_ONLY", profiles: [] },
  { bankId: "st-george", bankName: "St George", aliases: ["St.George"], supportStatus: "GENERIC_ONLY", profiles: [] },
  { bankId: "banksa", bankName: "BankSA", aliases: [], supportStatus: "GENERIC_ONLY", profiles: [] },
  { bankId: "bank-of-melbourne", bankName: "Bank of Melbourne", aliases: [], supportStatus: "GENERIC_ONLY", profiles: [] },
  { bankId: "suncorp", bankName: "Suncorp", aliases: ["Suncorp Bank"], supportStatus: "GENERIC_ONLY", profiles: [] },
  { bankId: "bendigo", bankName: "Bendigo Bank", aliases: ["Bendigo"], supportStatus: "GENERIC_ONLY", profiles: [] },
  { bankId: "adelaide", bankName: "Adelaide Bank", aliases: [], supportStatus: "GENERIC_ONLY", profiles: [] },
  { bankId: "boq", bankName: "BOQ", aliases: ["Bank of Queensland"], supportStatus: "GENERIC_ONLY", profiles: [] },
  { bankId: "ubank", bankName: "ubank", aliases: ["UBank"], supportStatus: "GENERIC_ONLY", profiles: [] },
  { bankId: "up", bankName: "Up", aliases: ["Up Bank"], supportStatus: "GENERIC_ONLY", profiles: [] },
  { bankId: "great-southern", bankName: "Great Southern Bank", aliases: [], supportStatus: "GENERIC_ONLY", profiles: [] },
  { bankId: "heritage", bankName: "Heritage Bank", aliases: ["Heritage"], supportStatus: "GENERIC_ONLY", profiles: [] },
  { bankId: "peoples-choice", bankName: "People's Choice", aliases: ["People’s Choice"], supportStatus: "GENERIC_ONLY", profiles: [] },
];

export const confirmedEverydayCsvProfiles = everydayBankFormatRegister.flatMap(
  (entry) => entry.profiles,
);

export function getEverydayBankFormatEntry(bankId: string) {
  return everydayBankFormatRegister.find((entry) => entry.bankId === bankId) ?? null;
}
