export const PUBLIC_APP_ROUTES = ["/onboarding", "/sign-in", "/sign-up"] as const;

export const PROTECTED_FINANCE_ROUTES = [
  "/",
  "/account",
  "/budgets",
  "/import",
  "/loans",
  "/regular-payments",
  "/settings",
  "/transactions",
] as const;

export const PROTECTED_API_ROUTES = ["/api/account", "/api/server"] as const;

function matchesRoute(pathname: string, route: string) {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isPublicAppPath(pathname: string) {
  return PUBLIC_APP_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function isProtectedApiPath(pathname: string) {
  return PROTECTED_API_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function isProtectedPath(pathname: string) {
  return isProtectedApiPath(pathname)
    || PROTECTED_FINANCE_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function sanitizeInternalReturnPath(
  value: string | string[] | null | undefined,
  fallback = "/",
) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (
    !candidate
    || !candidate.startsWith("/")
    || candidate.startsWith("//")
    || candidate.includes("\\")
    || /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return fallback;
  }

  try {
    const base = new URL("https://spendgrove.invalid");
    const parsed = new URL(candidate, base);
    if (parsed.origin !== base.origin) return fallback;
    if (parsed.pathname.startsWith("/sign-in") || parsed.pathname.startsWith("/sign-up")) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
}
