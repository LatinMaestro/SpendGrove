import { SignIn } from "@clerk/nextjs";
import { AuthSetupNotice } from "@/components/auth/auth-setup-notice";
import { LocalPrototypeDataNotice } from "@/components/auth/local-prototype-data-notice";
import { sanitizeInternalReturnPath } from "@/src/server/auth/route-policy";
import { getBuildSafeClerkEnvStatus } from "@/src/server/env";

type SignInPageProps = {
  searchParams?: Promise<{ redirect_url?: string | string[] }>;
};

export default async function SignInPage({ searchParams }: Readonly<SignInPageProps>) {
  const clerkStatus = getBuildSafeClerkEnvStatus();
  const resolvedSearchParams = await searchParams;
  const returnPath = sanitizeInternalReturnPath(resolvedSearchParams?.redirect_url);

  if (!clerkStatus.clerkConfigured) {
    return <AuthSetupNotice mode="sign-in" />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <LocalPrototypeDataNotice context="sign-in" />
      <div className="rounded-[2rem] border border-border bg-surface-base p-4 shadow-soft">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl={returnPath}
        />
      </div>
    </main>
  );
}
