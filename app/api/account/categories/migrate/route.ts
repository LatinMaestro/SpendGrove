import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  migrateDurableCustomCategories,
  type DurableCustomCategoryInput,
} from "@/src/server/custom-categories";

export const dynamic = "force-dynamic";

const safeMigrationMessages = new Set([
  "Choose valid saved categories before moving them to your account.",
  "Choose category names that are different from the category group names.",
]);

function safeMigrationError(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Check the saved categories and try again.";
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return "Sign in before moving categories to your account.";
    }
    if (safeMigrationMessages.has(error.message)) return error.message;
  }
  return "We could not move those categories safely. Your device copy was not changed.";
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const payload = await request.json() as { categories?: DurableCustomCategoryInput[] };
    if (!Array.isArray(payload.categories)) {
      throw new Error("Choose valid saved categories before moving them to your account.");
    }
    const result = await migrateDurableCustomCategories(context, payload.categories);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeMigrationError(error) }, { status: 400 });
  }
}
