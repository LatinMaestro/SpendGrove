export const PUBLIC_APP_ROUTES = ["/", "/import", "/onboarding", "/settings", "/sign-in", "/sign-up", "/transactions"] as const;

export const CLERK_PROTECTED_ROUTE_PATTERNS = ["/account(.*)", "/api/account(.*)", "/api/server(.*)"] as const;

const PROTECTED_PATH_PATTERNS = [/^\/account(?:\/.*)?$/, /^\/api\/account(?:\/.*)?$/, /^\/api\/server(?:\/.*)?$/];

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function isPublicPrototypePath(pathname: string) {
  return PUBLIC_APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
