import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { listHouseholdRecordWorkspace } from "@/src/server/household-records";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const householdId = new URL(request.url).searchParams.get("householdId")?.trim();
    if (!householdId) {
      return NextResponse.json({ ok: false, error: "Choose a household." }, { status: 400 });
    }
    const workspace = await listHouseholdRecordWorkspace(
      await getCurrentUserContext(),
      householdId,
    );
    return NextResponse.json({ ok: true, ...workspace });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Shared records could not be loaded safely.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
