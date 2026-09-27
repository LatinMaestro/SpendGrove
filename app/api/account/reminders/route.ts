import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  getInAppReminders,
  mutateInAppReminder,
} from "@/src/server/in-app-reminders";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Reminders could not be updated safely.";
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET() {
  try {
    const reminders = await getInAppReminders(await getCurrentUserContext());
    return NextResponse.json({ ok: true, ...reminders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const input = await request.json();
    await mutateInAppReminder(context, input);
    if (input?.action === "SET_PREFERENCE" && input.isEnabled) {
      await mutateInAppReminder(context, { action: "REFRESH_DERIVED" });
    }
    const reminders = await getInAppReminders(context);
    return NextResponse.json({ ok: true, ...reminders });
  } catch (error) {
    return errorResponse(error);
  }
}
