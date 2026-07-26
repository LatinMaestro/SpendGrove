import type { EnvSource } from "@/src/server/env";

/**
 * Migration-dependent foundations are enabled only in Vercel Preview.
 * Production, tests and unclassified runtimes fail closed. Tests that exercise
 * an activated service must opt in through that service's runtime override.
 */
export function isVerifiedPreviewRuntime(env: EnvSource = process.env) {
  if (env.NODE_ENV?.trim().toLowerCase() === "test") return false;
  return env.VERCEL_ENV?.trim().toLowerCase() === "preview";
}
