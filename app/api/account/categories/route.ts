import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  createDurableCustomCategory,
  listDurableCustomCategories,
  type DurableCustomCategoryInput,
} from "@/src/server/custom-categories";

export const dynamic = "force-dynamic";

function safeCategoryError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Check the category details and try again.";
  }
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return "Sign in to save categories to your SpendGrove account.";
    }
    if (error.message.includes("category") || error.message.includes("Category")) return error.message;
  }
  return "We could not save that category safely. Please check the details and try again.";
}

function errorResponse(error: unknown, status = 400) {
  return NextResponse.json({ ok: false, error: safeCategoryError(error) }, { status });
}

export async function GET() {
  try {
    const context = await getCurrentUserContext();
    const categories = await listDurableCustomCategories(context);
    return NextResponse.json({ ok: true, categories });
  } catch (error) {
    return errorResponse(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const input = await request.json() as DurableCustomCategoryInput;
    const category = await createDurableCustomCategory(context, input);
    const categories = await listDurableCustomCategories(context);
    return NextResponse.json({ ok: true, category, categories }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
