import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";

export type UserOwnedRecord = {
  userId?: string | null;
};

export type UserScopedWhere = Record<string, unknown> & {
  userId?: unknown;
};

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authenticated user context is required for server data access.");
    this.name = "AuthenticationRequiredError";
  }
}

export class OwnershipError extends Error {
  constructor(entityLabel = "record") {
    super(`Authenticated user does not own the requested ${entityLabel}.`);
    this.name = "OwnershipError";
  }
}

export function requireAuthenticatedUserContext(
  context: AuthenticatedUserContext | null | undefined,
): AuthenticatedUserContext {
  if (!context?.userId) {
    throw new AuthenticationRequiredError();
  }

  return context;
}

export function assertUserOwnsRecord(
  context: AuthenticatedUserContext | null | undefined,
  record: UserOwnedRecord | null | undefined,
  entityLabel = "record",
): asserts record is UserOwnedRecord & { userId: string } {
  const user = requireAuthenticatedUserContext(context);

  if (!record?.userId || record.userId !== user.userId) {
    throw new OwnershipError(entityLabel);
  }
}

export function createUserScopedWhere<TWhere extends UserScopedWhere>(
  context: AuthenticatedUserContext | null | undefined,
  where?: TWhere,
): Omit<TWhere, "userId"> & { userId: string } {
  const user = requireAuthenticatedUserContext(context);
  const currentWhere = where ?? ({} as TWhere);

  if ("userId" in currentWhere && currentWhere.userId !== undefined && currentWhere.userId !== user.userId) {
    throw new OwnershipError("query scope");
  }

  return {
    ...currentWhere,
    userId: user.userId,
  } as Omit<TWhere, "userId"> & { userId: string };
}

export function assertUserScopedWhere(
  context: AuthenticatedUserContext | null | undefined,
  where: UserScopedWhere | null | undefined,
) {
  const user = requireAuthenticatedUserContext(context);

  if (!where || where.userId !== user.userId) {
    throw new OwnershipError("query scope");
  }
}
