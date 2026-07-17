import { ClerkProvider } from "@clerk/nextjs";
import { getBuildSafeClerkEnvStatus } from "@/src/server/env";

export function ClerkAppProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const clerkStatus = getBuildSafeClerkEnvStatus();
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkStatus.publishableKeyConfigured || !publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} dynamic>
      {children}
    </ClerkProvider>
  );
}
