import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  listDurableCustomCategories,
  updateDurableCustomCategory,
} from "@/src/server/custom-categories";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    categoryId: string;
  };
};

const safeValidationMessages = new Set([
  "A category with this name already exists.",
  "Choose a category name that is different from the category group names.",
  "Choose a category change before saving.",
]);

function safeCategoryError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Check the category details and try again.";
  }
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return "Sign in to update account categories.";
    }
    if (error.name === "OwnershipError") return "That custom category could not be found for your account.";
    if (safeValidationMessages.has(error.message)) return error.message;
  }
  return "We could not update that category safely. Please try again.";
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const input = await request.json() as { name?: string; isArchived?: boolean };
    const category = await updateDurableCustomCategory(context, params.categoryId, input);
    const categories = await listDurableCustomCategories(context);
    return NextResponse.json({ ok: true, category, categories });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeCategoryError(error) }, { status: 400 });
  }
}
