export function validatePreviewConnectionIdentity({
  databaseUrl,
  directDatabaseUrl,
  expectedPooledHost,
  expectedDirectHost,
  expectedDatabase,
}) {
  try {
    const pooled = new URL(databaseUrl);
    const direct = new URL(directDatabaseUrl);
    const allowedProtocols = new Set(["postgres:", "postgresql:"]);

    if (!allowedProtocols.has(pooled.protocol) || !allowedProtocols.has(direct.protocol)) {
      return { ok: false, code: "PREVIEW_DATABASE_IDENTITY_MISMATCH" };
    }
    if (pooled.hostname !== expectedPooledHost || direct.hostname !== expectedDirectHost) {
      return { ok: false, code: "PREVIEW_DATABASE_IDENTITY_MISMATCH" };
    }
    if (!pooled.hostname.includes("-pooler.") || direct.hostname.includes("-pooler.")) {
      return { ok: false, code: "PREVIEW_DATABASE_IDENTITY_MISMATCH" };
    }

    const pooledDatabase = decodeURIComponent(pooled.pathname.replace(/^\//, ""));
    const directDatabase = decodeURIComponent(direct.pathname.replace(/^\//, ""));
    if (pooledDatabase !== expectedDatabase || directDatabase !== expectedDatabase) {
      return { ok: false, code: "PREVIEW_DATABASE_IDENTITY_MISMATCH" };
    }
    if (!pooled.username || !pooled.password || pooled.username !== direct.username || pooled.password !== direct.password) {
      return { ok: false, code: "PREVIEW_DATABASE_IDENTITY_MISMATCH" };
    }
    if ((pooled.port || "5432") !== (direct.port || "5432")) {
      return { ok: false, code: "PREVIEW_DATABASE_IDENTITY_MISMATCH" };
    }

    const allowedSslModes = new Set(["require", "verify-full"]);
    if (!allowedSslModes.has(pooled.searchParams.get("sslmode")) || !allowedSslModes.has(direct.searchParams.get("sslmode"))) {
      return { ok: false, code: "PREVIEW_DATABASE_IDENTITY_MISMATCH" };
    }

    return { ok: true, code: "PREVIEW_DATABASE_IDENTITY_CONFIRMED" };
  } catch {
    return { ok: false, code: "PREVIEW_DATABASE_IDENTITY_MISMATCH" };
  }
}
