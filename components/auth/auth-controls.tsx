"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function AuthControls({ clerkConfigured }: Readonly<{ clerkConfigured: boolean }>) {
  if (!clerkConfigured) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex min-h-11 items-center rounded-xl border border-border bg-surface-base px-3 text-xs font-bold text-brand-evergreen transition-colors hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        Account setup
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <button
            className="inline-flex min-h-11 items-center rounded-xl border border-border bg-surface-base px-3 text-xs font-bold text-brand-evergreen transition-colors hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            type="button"
          >
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button
            className="inline-flex min-h-11 items-center rounded-xl bg-brand-evergreen px-3 text-xs font-bold text-white transition-colors hover:bg-brand-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            type="button"
          >
            Sign up
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <div className="flex min-h-11 min-w-11 items-center justify-center">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </SignedIn>
    </div>
  );
}
