import { auth, currentUser } from "@clerk/nextjs/server";
import { getRequiredClerkRuntimeEnv, type EnvSource } from "@/src/server/env";
import {
  CLERK_AUTH_PROVIDER,
  findOrCreateUserForClerkIdentity,
  type ClerkIdentity,
  type UserProvisioningStore,
} from "@/src/server/auth/user-provisioning";

export type AuthProvider = "clerk";

export type AuthenticatedUserContext = {
  userId: string;
  provider: AuthProvider;
  providerUserId: string;
  isStub: false;
};

type RuntimeProbe = {
  hasWindow: boolean;
};

type ClerkAuthResult = {
  userId: string | null;
};

type ClerkUserResult = {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  primaryEmailAddress?: {
    emailAddress?: string | null;
  } | null;
  emailAddresses?: Array<{
    emailAddress?: string | null;
  }>;
} | null;

export type ClerkAuthLoader = () => Promise<ClerkAuthResult> | ClerkAuthResult;
export type ClerkUserLoader = () => Promise<ClerkUserResult> | ClerkUserResult;

export class CurrentUserAuthenticationError extends Error {
  constructor(message = "A signed-in Clerk user is required for this server action.") {
    super(message);
    this.name = "CurrentUserAuthenticationError";
  }
}

export function assertServerOnlyCurrentUser(runtime: RuntimeProbe = { hasWindow: typeof window !== "undefined" }) {
  if (runtime.hasWindow) {
    throw new Error("Current user context is server-only and must not be resolved in client components.");
  }
}

function cleanOptionalText(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned && cleaned.length > 0 ? cleaned : null;
}

function getDisplayName(user: ClerkUserResult) {
  const fullName = cleanOptionalText(user?.fullName);
  if (fullName) {
    return fullName;
  }

  const joinedName = [user?.firstName, user?.lastName].map(cleanOptionalText).filter(Boolean).join(" ");
  if (joinedName) {
    return joinedName;
  }

  return cleanOptionalText(user?.username);
}

function getPrimaryEmail(user: ClerkUserResult) {
  return cleanOptionalText(user?.primaryEmailAddress?.emailAddress)
    ?? cleanOptionalText(user?.emailAddresses?.[0]?.emailAddress);
}

export async function getClerkIdentity(options: {
  env?: EnvSource;
  loadAuth?: ClerkAuthLoader;
  loadUser?: ClerkUserLoader;
} = {}): Promise<ClerkIdentity> {
  getRequiredClerkRuntimeEnv(options.env);

  const authResult = await (options.loadAuth ?? auth)();

  if (!authResult.userId) {
    throw new CurrentUserAuthenticationError();
  }

  const user = await (options.loadUser ?? currentUser)();

  return {
    providerUserId: authResult.userId,
    email: getPrimaryEmail(user),
    name: getDisplayName(user),
  };
}

export async function getCurrentUserContext(options: {
  env?: EnvSource;
  loadAuth?: ClerkAuthLoader;
  loadUser?: ClerkUserLoader;
  store?: UserProvisioningStore;
} = {}): Promise<AuthenticatedUserContext> {
  assertServerOnlyCurrentUser();

  const identity = await getClerkIdentity(options);
  const user = await findOrCreateUserForClerkIdentity(identity, options.store);

  return {
    userId: user.id,
    provider: "clerk",
    providerUserId: user.authProviderUserId,
    isStub: false,
  };
}

export function isClerkBackedUserContext(context: AuthenticatedUserContext) {
  return context.provider === "clerk" && context.isStub === false && context.providerUserId.length > 0;
}

export { CLERK_AUTH_PROVIDER };
