import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { listSavingsGoals, mutateSavingsGoal } from "@/src/server/savings-goals";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Savings goals could not be updated safely.";
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET() {
  try {
    const goals = await listSavingsGoals(await getCurrentUserContext());
    return NextResponse.json({ ok: true, goals });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const goal = await mutateSavingsGoal(await getCurrentUserContext(), await request.json());
    const goals = await listSavingsGoals(await getCurrentUserContext());
    return NextResponse.json({ ok: true, goal, goals });
  } catch (error) {
    return errorResponse(error);
  }
}
