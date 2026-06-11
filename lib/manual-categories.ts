export type ManualCategoryType = "INCOME" | "EXPENSE" | "TRANSFER";

export type ManualCategory = {
  id: string;
  name: string;
  type: ManualCategoryType;
  group: string;
};

type CategoryGroupDefinition = {
  name: string;
  categories: Array<[name: string, type: ManualCategoryType]>;
};

const categoryGroups: CategoryGroupDefinition[] = [
  {
    name: "Income",
    categories: [
      ["Salary / wages", "INCOME"],
      ["Business income", "INCOME"],
      ["Rental income", "INCOME"],
      ["Interest income", "INCOME"],
      ["Dividends", "INCOME"],
      ["Refunds / rebates", "INCOME"],
      ["Government payments", "INCOME"],
      ["Other income", "INCOME"],
    ],
  },
  {
    name: "Everyday spending",
    categories: [
      ["Groceries", "EXPENSE"],
      ["Dining out", "EXPENSE"],
      ["Coffee / takeaway", "EXPENSE"],
      ["Transport", "EXPENSE"],
      ["Fuel", "EXPENSE"],
      ["Parking", "EXPENSE"],
      ["Public transport", "EXPENSE"],
      ["Rideshare / taxi", "EXPENSE"],
      ["Shopping", "EXPENSE"],
      ["Clothing", "EXPENSE"],
      ["Health / pharmacy", "EXPENSE"],
      ["Medical / dental", "EXPENSE"],
      ["Entertainment", "EXPENSE"],
      ["Hobbies", "EXPENSE"],
      ["Gifts", "EXPENSE"],
      ["Pets", "EXPENSE"],
    ],
  },
  {
    name: "Bills and household",
    categories: [
      ["Electricity", "EXPENSE"],
      ["Gas", "EXPENSE"],
      ["Water", "EXPENSE"],
      ["Internet", "EXPENSE"],
      ["Mobile phone", "EXPENSE"],
      ["Streaming / subscriptions", "EXPENSE"],
      ["Insurance", "EXPENSE"],
      ["Council rates", "EXPENSE"],
      ["Rent", "EXPENSE"],
      ["Mortgage / loan repayment", "EXPENSE"],
      ["Home maintenance", "EXPENSE"],
      ["Homewares", "EXPENSE"],
      ["Bank fees", "EXPENSE"],
    ],
  },
  {
    name: "Financial",
    categories: [
      ["Transfer", "TRANSFER"],
      ["Savings transfer", "TRANSFER"],
      ["Investment contribution", "TRANSFER"],
      ["Credit card payment", "TRANSFER"],
      ["Loan repayment", "EXPENSE"],
      ["Interest charged", "EXPENSE"],
      ["Fees", "EXPENSE"],
      ["Tax payment", "EXPENSE"],
      ["ATO refund", "INCOME"],
    ],
  },
  {
    name: "Work and tax",
    categories: [
      ["Work travel", "EXPENSE"],
      ["Uniforms / protective clothing", "EXPENSE"],
      ["Training / education", "EXPENSE"],
      ["Professional memberships", "EXPENSE"],
      ["Home office", "EXPENSE"],
      ["Tools / equipment", "EXPENSE"],
      ["Donations", "EXPENSE"],
      ["Tax agent fees", "EXPENSE"],
      ["Other deductible expense", "EXPENSE"],
    ],
  },
  {
    name: "Review",
    categories: [
      ["Uncategorised", "EXPENSE"],
      ["Needs review", "EXPENSE"],
      ["Possible duplicate", "EXPENSE"],
    ],
  },
];

function toCategoryId(group: string, name: string, type: ManualCategoryType) {
  return `${group}-${name}-${type}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const manualCategories: ManualCategory[] = categoryGroups.flatMap((group) =>
  group.categories.map(([name, type]) => ({
    id: toCategoryId(group.name, name, type),
    name,
    type,
    group: group.name,
  })),
);

export function getManualCategory(categoryId: string) {
  return manualCategories.find((category) => category.id === categoryId);
}

export function getManualCategoryGroups(type: ManualCategoryType) {
  return categoryGroups
    .map((group) => ({
      name: group.name,
      categories: manualCategories.filter(
        (category) => category.group === group.name && category.type === type,
      ),
    }))
    .filter((group) => group.categories.length > 0);
}
