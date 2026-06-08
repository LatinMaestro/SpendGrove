import { CategoryType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const devUserEmail = "dev@spendgrove.local";

const seedCategories = [
  { name: "Income", type: CategoryType.INCOME, children: ["Salary", "Interest", "Other income"] },
  { name: "Everyday", type: CategoryType.EXPENSE, children: ["Groceries", "Dining out", "Household", "Shopping"] },
  { name: "Bills", type: CategoryType.EXPENSE, children: ["Electricity", "Gas", "Water", "Phone & internet", "Insurance", "Council rates"] },
  { name: "Transport", type: CategoryType.EXPENSE, children: ["Public transport", "Fuel", "Parking", "Rideshare", "Vehicle maintenance"] },
  { name: "Health", type: CategoryType.EXPENSE, children: ["Medical", "Pharmacy", "Fitness"] },
  { name: "Lifestyle", type: CategoryType.EXPENSE, children: ["Entertainment", "Subscriptions", "Travel", "Gifts"] },
  { name: "Fees", type: CategoryType.EXPENSE, children: ["Bank fees", "Account fees", "Other fees"] },
  { name: "Transfers", type: CategoryType.TRANSFER, children: ["Internal transfer", "Savings transfer"] },
];

async function main() {
  const user = await prisma.user.upsert({
    where: { email: devUserEmail },
    update: {},
    create: {
      email: devUserEmail,
      name: "SpendGrove Dev User",
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

  for (const category of seedCategories) {
    const parent = await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId: user.id,
          name: category.name,
          type: category.type,
        },
      },
      update: { isSeeded: true, isArchived: false, deletedAt: null },
      create: {
        userId: user.id,
        name: category.name,
        type: category.type,
        isSeeded: true,
      },
    });

    for (const [index, childName] of category.children.entries()) {
      await prisma.category.upsert({
        where: {
          userId_name_type: {
            userId: user.id,
            name: childName,
            type: category.type,
          },
        },
        update: {
          parentId: parent.id,
          isSeeded: true,
          isArchived: false,
          deletedAt: null,
          sortOrder: index,
        },
        create: {
          userId: user.id,
          name: childName,
          type: category.type,
          parentId: parent.id,
          isSeeded: true,
          sortOrder: index,
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
