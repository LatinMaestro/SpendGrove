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
const privateCacheControl = "private, no-store, max-age=0";

function protectPrivateResponse(response: NextResponse) {
  response.headers.set("Cache-Control", privateCacheControl);
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function unauthenticatedResponse(request: NextRequest) {
  if (isProtectedApiPath(request.nextUrl.pathname)) {
    return protectPrivateResponse(NextResponse.json(
      { ok: false, error: "Sign in to continue." },
      { status: 401 },
    ));
  }

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set(
    "redirect_url",
    sanitizeInternalReturnPath(`${request.nextUrl.pathname}${request.nextUrl.search}`),
  );
  return protectPrivateResponse(NextResponse.redirect(signInUrl));
}

const privateBetaMiddleware = clerkMiddleware(
  async (auth, request) => {
    if (!isProtectedPath(request.nextUrl.pathname)) {
      return NextResponse.next();
    }

    const { isAuthenticated } = await auth();
    if (!isAuthenticated) {
      return unauthenticatedResponse(request);
    }

    return protectPrivateResponse(NextResponse.next());
  },
  {
    contentSecurityPolicy: {
      strict: true,
      directives: {
        "base-uri": ["'self'"],
        "frame-ancestors": ["'none'"],
        "object-src": ["'none'"],
      },
    },
  },
);

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  // Fail closed for operational routes when Clerk is not configured.
  if (!clerkEnvStatus.clerkConfigured) {
    return isProtectedPath(request.nextUrl.pathname)
      ? unauthenticatedResponse(request)
      : NextResponse.next();
  }

  // Run Clerk middleware for both public and protected document requests so its
  // nonce-based CSP also covers the public authentication surfaces.
  return privateBetaMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
