import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { undoImportBatch } from "@/src/server/import-undo";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ batchId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const result = await undoImportBatch(
      await getCurrentUserContext(),
      (await params).batchId,
      await request.json(),
    );
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "This import could not be undone safely.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
