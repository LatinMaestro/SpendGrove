import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserContext } from "@/src/server/auth/current-user";
import {
  getPropertyTransactionLinkSnapshot,
  linkTransactionToProperty,
  unlinkTransactionFromProperty,
} from "@/src/server/property-transaction-links";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ transactionId: string }> };

function safeError(error: unknown) {
  if (error instanceof ZodError) return "Choose an active Property before linking.";
  if (error instanceof Error) {
    if (error.name === "CurrentUserAuthenticationError" || error.name === "AuthenticationRequiredError") {
      return "Sign in to manage Property record keeping.";
    }
    if (error.name === "OwnershipError") return "That transaction or Property is not available for your account.";
    if (error.name === "PropertyTransactionLinkConflictError") return error.message;
  }
  return "The Property link could not be updated safely.";
}

function errorResponse(error: unknown) {
  return NextResponse.json({ ok: false, error: safeError(error) }, { status: 400 });
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const snapshot = await getPropertyTransactionLinkSnapshot(context, (await params).transactionId);
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const input = await request.json();
    const outcome = await linkTransactionToProperty(context, (await params).transactionId, input);
    return NextResponse.json({ ok: true, ...outcome });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentUserContext();
    const result = await unlinkTransactionFromProperty(context, (await params).transactionId);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return errorResponse(error);
  }
}
