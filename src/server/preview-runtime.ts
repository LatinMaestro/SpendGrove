import type { EnvSource } from "@/src/server/env";

/**
 * Migration-dependent foundations are enabled only in Vercel Preview.
 * Production and unclassified runtimes fail closed.
 */
export function isVerifiedPreviewRuntime(env: EnvSource = process.env) {
  return env.VERCEL_ENV?.trim().toLowerCase() === "preview";
}
