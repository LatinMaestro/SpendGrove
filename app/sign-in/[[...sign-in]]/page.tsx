import { SignIn } from "@clerk/nextjs";
import { AuthSetupNotice } from "@/components/auth/auth-setup-notice";
import { getBuildSafeClerkEnvStatus } from "@/src/server/env";

export default function SignInPage() {
  const clerkStatus = getBuildSafeClerkEnvStatus();

  if (!clerkStatus.clerkConfigured) {
    return <AuthSetupNotice mode="sign-in" />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-[2rem] border border-border bg-surface-base p-4 shadow-soft">
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" afterSignInUrl="/" />
      </div>
    </main>
  );
}
