import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBuildSafeClerkEnvStatus } from "@/src/server/env";

export async function requireAuthenticatedPage() {
  if (!getBuildSafeClerkEnvStatus().clerkConfigured) {
    redirect("/sign-in");
  }

  await auth.protect();
}
