"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function AuthControls({ clerkConfigured }: Readonly<{ clerkConfigured: boolean }>) {
  if (!clerkConfigured) {
    return (
      <Link
        href="/sign-in"
        className="rounded-full bg-brand-green/10 px-3 py-2 text-xs font-bold text-brand-deepTeal ring-1 ring-brand-green/20"
      >
        Account setup
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="rounded-full bg-white px-3 py-2 text-xs font-bold text-brand-deepTeal ring-1 ring-border" type="button">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="rounded-full bg-brand-green px-3 py-2 text-xs font-bold text-white" type="button">
            Sign up
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}
