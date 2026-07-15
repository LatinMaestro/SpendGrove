import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { updatePropertyRecord, type PropertyUpdateInput } from "@/src/server/loan-metadata";

export const dynamic = "force-dynamic";

function safeError(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Check the property details and try again.";
  if (error instanceof Error) {
    if (error.name === "OwnershipError") return "That property could not be found for your account.";
    if (/private bank identifier/i.test(error.message)) return error.message;
  }
  return "We could not update that property safely. Please try again.";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  try {
    const context = await getCurrentUserContext();
    const input = await request.json() as PropertyUpdateInput;
    return NextResponse.json({ ok: true, ...(await updatePropertyRecord(context, (await params).propertyId, input)) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
  }
}
