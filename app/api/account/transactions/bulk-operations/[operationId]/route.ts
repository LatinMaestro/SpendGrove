import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  BulkOperationNotFoundError,
  BulkOperationsUnavailableError,
  getBulkOperation,
} from "@/src/server/bulk-operations";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ operationId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const operation = await getBulkOperation(context, (await params).operationId);
    return NextResponse.json({ ok: true, operation });
  } catch (error) {
    if (error instanceof BulkOperationsUnavailableError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
    }
    if (error instanceof BulkOperationNotFoundError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    if (error instanceof Error && (
      error.name === "CurrentUserAuthenticationError" ||
      error.name === "AuthenticationRequiredError"
    )) {
      return NextResponse.json({ ok: false, error: "Sign in to view bulk changes." }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "That bulk change could not be loaded safely." }, { status: 400 });
  }
}
