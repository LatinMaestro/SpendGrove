import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { renameDurableMerchantProfile } from "@/src/server/merchant-rules";
import { safeMerchantRouteError } from "@/src/server/merchant-route-errors";

export const dynamic = "force-dynamic";

type RouteContext = { params: { profileId: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const input = await request.json() as { name?: string };
    if (!input.name) throw new Error("Check the merchant details and try again.");
    const data = await renameDurableMerchantProfile(await getCurrentUserContext(), params.profileId, input.name);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const safe = safeMerchantRouteError(error);
    return NextResponse.json(safe.body, { status: safe.status });
  }
}
