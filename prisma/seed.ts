import { CategoryType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const devUserEmail = "dev@spendgrove.local";

const seedCategoryGroups = [
  {
    name: "Income",
    type: CategoryType.INCOME,
    children: [
      ["Salary / wages", CategoryType.INCOME],
      ["Business income", CategoryType.INCOME],
      ["Rental income", CategoryType.INCOME],
      ["Interest income", CategoryType.INCOME],
      ["Dividends", CategoryType.INCOME],
      ["Refunds / rebates", CategoryType.INCOME],
      ["Government payments", CategoryType.INCOME],
      ["Other income", CategoryType.INCOME],
    ],
  },
  {
    name: "Everyday spending",
    type: CategoryType.EXPENSE,
    children: [
      ["Groceries", CategoryType.EXPENSE],
      ["Dining out", CategoryType.EXPENSE],
      ["Coffee / takeaway", CategoryType.EXPENSE],
      ["Transport", CategoryType.EXPENSE],
      ["Fuel", CategoryType.EXPENSE],
      ["Parking", CategoryType.EXPENSE],
      ["Public transport", CategoryType.EXPENSE],
      ["Rideshare / taxi", CategoryType.EXPENSE],
      ["Shopping", CategoryType.EXPENSE],
      ["Clothing", CategoryType.EXPENSE],
      ["Health / pharmacy", CategoryType.EXPENSE],
      ["Medical / dental", CategoryType.EXPENSE],
      ["Entertainment", CategoryType.EXPENSE],
      ["Hobbies", CategoryType.EXPENSE],
      ["Gifts", CategoryType.EXPENSE],
      ["Pets", CategoryType.EXPENSE],
    ],
  },
  {
    name: "Bills and household",
    type: CategoryType.EXPENSE,
    children: [
      ["Electricity", CategoryType.EXPENSE],
      ["Gas", CategoryType.EXPENSE],
      ["Water", CategoryType.EXPENSE],
      ["Internet", CategoryType.EXPENSE],
      ["Mobile phone", CategoryType.EXPENSE],
      ["Streaming / subscriptions", CategoryType.EXPENSE],
      ["Insurance", CategoryType.EXPENSE],
      ["Council rates", CategoryType.EXPENSE],
      ["Rent", CategoryType.EXPENSE],
      ["Mortgage / loan repayment", CategoryType.EXPENSE],
      ["Home maintenance", CategoryType.EXPENSE],
      ["Homewares", CategoryType.EXPENSE],
      ["Bank fees", CategoryType.EXPENSE],
    ],
  },
  {
    name: "Financial",
    type: CategoryType.EXPENSE,
    children: [
      ["Savings transfer", CategoryType.TRANSFER],
      ["Investment contribution", CategoryType.TRANSFER],
      ["Credit card payment", CategoryType.TRANSFER],
      ["Loan repayment", CategoryType.EXPENSE],
      ["Interest charged", CategoryType.EXPENSE],
      ["Fees", CategoryType.EXPENSE],
      ["Tax payment", CategoryType.EXPENSE],
      ["ATO refund", CategoryType.INCOME],
    ],
  },
  {
    name: "Work and tax",
    type: CategoryType.EXPENSE,
    children: [
      ["Work travel", CategoryType.EXPENSE],
      ["Uniforms / protective clothing", CategoryType.EXPENSE],
      ["Training / education", CategoryType.EXPENSE],
      ["Professional memberships", CategoryType.EXPENSE],
      ["Home office", CategoryType.EXPENSE],
      ["Tools / equipment", CategoryType.EXPENSE],
      ["Donations", CategoryType.EXPENSE],
      ["Tax agent fees", CategoryType.EXPENSE],
      ["Other deductible expense", CategoryType.EXPENSE],
    ],
  },
  {
    name: "Review",
    type: CategoryType.EXPENSE,
    children: [
      ["Uncategorised", CategoryType.EXPENSE],
      ["Needs review", CategoryType.EXPENSE],
      ["Possible duplicate", CategoryType.EXPENSE],
      ["Transfer to review", CategoryType.TRANSFER],
    ],
  },
] as const;

async function main() {
  const user = await prisma.user.upsert({
    where: { email: devUserEmail },
    update: {},
    create: {
      email: devUserEmail,
      name: "SpendGrove Dev User",
      country: "AU",
      timezone: "Australia/Brisbane",
      settings: {
        create: {
          simpleMode: true,
          currency: "AUD",
          locale: "en-AU",
          financialYearStartMonth: 7,
          featureFlags: {
            loans: false,
            property: false,
            tax: false,
            recurring: false,
            basiq: false,
            payments: false,
            ai: false,
          },
        },
      },
    },
  });

  for (const [groupIndex, group] of seedCategoryGroups.entries()) {
    const parent = await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId: user.id,
          name: group.name,
          type: group.type,
        },
      },
      update: {
        isSeeded: true,
        isArchived: false,
        deletedAt: null,
        sortOrder: groupIndex,
      },
      create: {
        userId: user.id,
        name: group.name,
        type: group.type,
        isSeeded: true,
        sortOrder: groupIndex,
      },
    });

    for (const [childIndex, [childName, childType]] of group.children.entries()) {
      await prisma.category.upsert({
        where: {
          userId_name_type: {
            userId: user.id,
            name: childName,
            type: childType,
          },
        },
        update: {
          parentId: parent.id,
          isSeeded: true,
          isArchived: false,
          deletedAt: null,
          sortOrder: childIndex,
        },
        create: {
          userId: user.id,
          name: childName,
          type: childType,
          parentId: parent.id,
          isSeeded: true,
          sortOrder: childIndex,
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
