import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CLERK_PROTECTED_ROUTE_PATTERNS } from "@/src/server/auth/route-policy";
import { getBuildSafeClerkEnvStatus } from "@/src/server/env";

const isProtectedRoute = createRouteMatcher([...CLERK_PROTECTED_ROUTE_PATTERNS]);
const clerkEnvStatus = getBuildSafeClerkEnvStatus();

const clerkProtectedMiddleware = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export default function middleware(request: Parameters<typeof clerkProtectedMiddleware>[0], event: Parameters<typeof clerkProtectedMiddleware>[1]) {
  if (!clerkEnvStatus.clerkConfigured) {
    return NextResponse.next();
  }

  return clerkProtectedMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
