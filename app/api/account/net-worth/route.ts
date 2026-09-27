import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { getNetWorthOverview, mutateNetWorth } from "@/src/server/net-worth";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Net worth records could not be updated safely.";
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET() {
  try {
    const overview = await getNetWorthOverview(await getCurrentUserContext());
    return NextResponse.json({ ok: true, ...overview });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const result = await mutateNetWorth(context, await request.json());
    const overview = await getNetWorthOverview(context);
    return NextResponse.json({ ok: true, result, ...overview });
  } catch (error) {
    return errorResponse(error);
  }
}
