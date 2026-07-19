import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { listHouseholds, mutateHousehold } from "@/src/server/households";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Household access could not be updated safely.";
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET() {
  try {
    const households = await listHouseholds(await getCurrentUserContext());
    return NextResponse.json({ ok: true, households });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const result = await mutateHousehold(context, await request.json());
    const households = await listHouseholds(context);
    return NextResponse.json({ ok: true, result, households });
  } catch (error) {
    return errorResponse(error);
  }
}
