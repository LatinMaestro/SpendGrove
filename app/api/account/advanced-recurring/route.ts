import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  listAdvancedRecurringItems,
  listRecurringInstanceCandidates,
  mutateAdvancedRecurringItem,
} from "@/src/server/advanced-recurring";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Regular payment details could not be updated safely.";
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET() {
  try {
    const context = await getCurrentUserContext();
    const [items, candidates] = await Promise.all([
      listAdvancedRecurringItems(context),
      listRecurringInstanceCandidates(context),
    ]);
    return NextResponse.json({ ok: true, items, candidates });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const item = await mutateAdvancedRecurringItem(context, await request.json());
    const [items, candidates] = await Promise.all([
      listAdvancedRecurringItems(context),
      listRecurringInstanceCandidates(context),
    ]);
    return NextResponse.json({ ok: true, item, items, candidates });
  } catch (error) {
    return errorResponse(error);
  }
}
