import { NextResponse } from "next/server";
import type { LocalMerchantData } from "@/lib/merchant-rules";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { migrateDurableMerchantData } from "@/src/server/merchant-rules";
import { safeMerchantRouteError } from "@/src/server/merchant-route-errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { data?: LocalMerchantData };
    if (!payload.data || !Array.isArray(payload.data.profiles) || !Array.isArray(payload.data.aliases) || !Array.isArray(payload.data.rules)) {
      throw new Error("Check the saved merchant choices and try again.");
    }
    const result = await migrateDurableMerchantData(await getCurrentUserContext(), payload.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const safe = safeMerchantRouteError(error);
    return NextResponse.json(safe.body, { status: safe.status });
  }
}
