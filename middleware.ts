import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  isProtectedApiPath,
  isProtectedPath,
  sanitizeInternalReturnPath,
} from "@/src/server/auth/route-policy";
import { getBuildSafeClerkEnvStatus } from "@/src/server/env";

const clerkEnvStatus = getBuildSafeClerkEnvStatus();

function unauthenticatedResponse(request: NextRequest) {
  if (isProtectedApiPath(request.nextUrl.pathname)) {
    return NextResponse.json(
      { ok: false, error: "Sign in to continue." },
      { status: 401 },
    );
  }

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set(
    "redirect_url",
    sanitizeInternalReturnPath(`${request.nextUrl.pathname}${request.nextUrl.search}`),
  );
  return NextResponse.redirect(signInUrl);
}

const privateBetaMiddleware = clerkMiddleware(async (auth, request) => {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    return unauthenticatedResponse(request);
  }

  return NextResponse.next();
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Fail closed for operational routes when Clerk is not configured.
  if (!clerkEnvStatus.clerkConfigured) {
    return unauthenticatedResponse(request);
  }

  return privateBetaMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
