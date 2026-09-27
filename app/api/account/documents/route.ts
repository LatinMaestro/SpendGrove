import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import { listDocumentLinkCandidates } from "@/src/server/document-link-candidates";
import { listDocuments, mutateDocumentMetadata } from "@/src/server/documents";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Document details could not be updated safely.";
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

async function snapshot(context: Awaited<ReturnType<typeof getCurrentUserContext>>) {
  const [documents, linkCandidates] = await Promise.all([
    listDocuments(context),
    listDocumentLinkCandidates(context),
  ]);
  return { documents, linkCandidates };
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
    const result = await mutateDocumentMetadata(context, await request.json());
    return NextResponse.json({ ok: true, result, ...await snapshot(context) });
  } catch (error) {
    return errorResponse(error);
  }
}
