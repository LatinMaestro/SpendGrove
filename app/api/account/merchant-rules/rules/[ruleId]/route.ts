import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { deleteDurableMerchantRule, updateDurableMerchantRule } from "@/src/server/merchant-rules";
import { safeMerchantRouteError } from "@/src/server/merchant-route-errors";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ ruleId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const input = await request.json() as { isActive?: boolean };
    const data = await updateDurableMerchantRule(await getCurrentUserContext(), (await params).ruleId, input);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const safe = safeMerchantRouteError(error);
    return NextResponse.json(safe.body, { status: safe.status });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const data = await deleteDurableMerchantRule(await getCurrentUserContext(), (await params).ruleId);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const safe = safeMerchantRouteError(error);
    return NextResponse.json(safe.body, { status: safe.status });
  }
}
