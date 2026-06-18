import { NextResponse } from "next/server";
import type { LocalMerchantData, MerchantConflictResolution } from "@/lib/merchant-rules";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  clearDurableMerchantData,
  listDurableMerchantData,
  saveDurableMerchantAlias,
  saveDurableMerchantRule,
} from "@/src/server/merchant-rules";
import { safeMerchantRouteError } from "@/src/server/merchant-route-errors";
import { replaceDurableMerchantData } from "@/src/server/merchant-snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, data: await listDurableMerchantData(await getCurrentUserContext()) });
  } catch (error) {
    const safe = safeMerchantRouteError(error);
    return NextResponse.json(safe.body, { status: safe.status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const input = await request.json() as {
      kind?: "RULE" | "ALIAS";
      merchantName?: string;
      alias?: string;
      canonicalName?: string;
      categoryId?: string;
      resolution?: MerchantConflictResolution;
    };
    if (input.kind === "RULE" && input.merchantName && input.categoryId) {
      const data = await saveDurableMerchantRule(context, {
        merchantName: input.merchantName,
        categoryId: input.categoryId,
        resolution: input.resolution,
      });
      return NextResponse.json({ ok: true, data }, { status: 201 });
    }
    if (input.kind === "ALIAS" && input.alias && input.canonicalName && input.categoryId) {
      const data = await saveDurableMerchantAlias(context, {
        alias: input.alias,
        canonicalName: input.canonicalName,
        categoryId: input.categoryId,
        resolution: input.resolution,
      });
      return NextResponse.json({ ok: true, data }, { status: 201 });
    }
    throw new Error("Check the merchant details and try again.");
  } catch (error) {
    const safe = safeMerchantRouteError(error);
    return NextResponse.json(safe.body, { status: safe.status });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json() as { data?: LocalMerchantData };
    if (!payload.data) throw new Error("Check the merchant details and try again.");
    const data = await replaceDurableMerchantData(await getCurrentUserContext(), payload.data);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const safe = safeMerchantRouteError(error);
    return NextResponse.json(safe.body, { status: safe.status });
  }
}

export async function DELETE() {
  try {
    const data = await clearDurableMerchantData(await getCurrentUserContext());
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const safe = safeMerchantRouteError(error);
    return NextResponse.json(safe.body, { status: safe.status });
  }
}
