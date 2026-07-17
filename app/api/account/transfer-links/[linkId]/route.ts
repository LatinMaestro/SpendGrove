import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  TransferLinkConflictError,
  TransferLinkNotFoundError,
  TransferLinksUnavailableError,
  unlinkTransferLink,
} from "@/src/server/transfer-links";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ linkId: string }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const transferLink = await unlinkTransferLink(context, (await params).linkId);
    return NextResponse.json({ ok: true, transferLink });
  } catch (error) {
    if (error instanceof TransferLinksUnavailableError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
    }
    if (error instanceof TransferLinkNotFoundError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    if (error instanceof TransferLinkConflictError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    }
    if (error instanceof Error && (
      error.name === "CurrentUserAuthenticationError"
      || error.name === "AuthenticationRequiredError"
    )) {
      return NextResponse.json({ ok: false, error: "Sign in to unlink transfers." }, { status: 401 });
    }
    return NextResponse.json(
      { ok: false, error: "The transfer link could not be removed safely." },
      { status: 400 },
    );
  }
}
