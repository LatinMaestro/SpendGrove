import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  BulkOperationNotFoundError,
  BulkOperationsUnavailableError,
  BulkOperationUndoUnavailableError,
  undoBulkOperation,
} from "@/src/server/bulk-operations";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ operationId: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const operation = await undoBulkOperation(context, (await params).operationId);
    return NextResponse.json({ ok: true, operation });
  } catch (error) {
    if (error instanceof BulkOperationsUnavailableError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
    }
    if (error instanceof BulkOperationNotFoundError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    if (error instanceof BulkOperationUndoUnavailableError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    }
    if (error instanceof Error && (
      error.name === "CurrentUserAuthenticationError" ||
      error.name === "AuthenticationRequiredError"
    )) {
      return NextResponse.json({ ok: false, error: "Sign in to undo account changes." }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "The bulk change could not be undone safely." }, { status: 400 });
  }
}
