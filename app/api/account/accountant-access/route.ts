import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  listAccountantAccess,
  mutateAccountantAccess,
} from "@/src/server/accountant-access";
import { getAccountantRecordWorkspace } from "@/src/server/accountant-records";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Accountant access could not be updated safely.";
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

async function snapshot(context: Awaited<ReturnType<typeof getCurrentUserContext>>) {
  const [access, records] = await Promise.all([
    listAccountantAccess(context),
    getAccountantRecordWorkspace(context),
  ]);
  return { ...access, ...records };
}

export async function GET() {
  try {
    const context = await getCurrentUserContext();
    return NextResponse.json({ ok: true, ...await snapshot(context) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUserContext();
    const result = await mutateAccountantAccess(context, await request.json());
    return NextResponse.json({ ok: true, result, ...await snapshot(context) });
  } catch (error) {
    return errorResponse(error);
  }
}
