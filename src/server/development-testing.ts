import type { EnvSource } from "@/src/server/env";

export function isDevelopmentTestingEnvironment(env: EnvSource = process.env) {
  const vercelEnvironment = env.VERCEL_ENV?.trim().toLowerCase();

  if (vercelEnvironment === "preview" || vercelEnvironment === "development") {
    return true;
  }

  if (vercelEnvironment === "production") {
    return false;
  }

  return env.NODE_ENV?.trim().toLowerCase() === "development";
}
