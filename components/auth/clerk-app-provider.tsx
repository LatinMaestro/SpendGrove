import { ClerkProvider } from "@clerk/nextjs";
import { getBuildSafeClerkEnvStatus } from "@/src/server/env";

export function ClerkAppProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const clerkStatus = getBuildSafeClerkEnvStatus();

  if (!clerkStatus.publishableKeyConfigured) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
}
