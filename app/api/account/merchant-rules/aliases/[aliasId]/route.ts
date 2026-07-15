import { NextResponse } from "next/server";
import type { MerchantConflictResolution } from "@/lib/merchant-rules";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { deleteDurableMerchantAlias, updateDurableMerchantAlias } from "@/src/server/merchant-rules";
import { safeMerchantRouteError } from "@/src/server/merchant-route-errors";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ aliasId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const input = await request.json() as { name?: string; isActive?: boolean; resolution?: MerchantConflictResolution };
    const data = await updateDurableMerchantAlias(await getCurrentUserContext(), (await params).aliasId, input);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const safe = safeMerchantRouteError(error);
    return NextResponse.json(safe.body, { status: safe.status });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const data = await deleteDurableMerchantAlias(await getCurrentUserContext(), (await params).aliasId);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const safe = safeMerchantRouteError(error);
    return NextResponse.json(safe.body, { status: safe.status });
  }
}
