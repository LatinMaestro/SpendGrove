import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { getImportUndoStatus } from "@/src/server/import-undo";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ batchId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const result = await getImportUndoStatus(await getCurrentUserContext(), (await params).batchId);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import undo status is unavailable.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
