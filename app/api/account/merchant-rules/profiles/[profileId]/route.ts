import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { updateDurableMerchantProfile } from "@/src/server/merchant-rules";
import { safeMerchantRouteError } from "@/src/server/merchant-route-errors";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ profileId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const input = await request.json() as { name?: unknown; categoryId?: unknown; isActive?: unknown };
    const keys = Object.keys(input);
    if (
      keys.length === 0 ||
      keys.some((key) => !["name", "categoryId", "isActive"].includes(key)) ||
      (input.name !== undefined && typeof input.name !== "string") ||
      (input.categoryId !== undefined && typeof input.categoryId !== "string") ||
      (input.isActive !== undefined && typeof input.isActive !== "boolean")
    ) {
      throw new Error("Check the merchant details and try again.");
    }
    const data = await updateDurableMerchantProfile(
      await getCurrentUserContext(),
      (await params).profileId,
      {
        ...(typeof input.name === "string" ? { name: input.name } : {}),
        ...(typeof input.categoryId === "string" ? { categoryId: input.categoryId } : {}),
        ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
      },
    );
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const safe = safeMerchantRouteError(error);
    return NextResponse.json(safe.body, { status: safe.status });
  }
}
