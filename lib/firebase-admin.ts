/**
 * 🔥 FIREBASE ADMIN SDK (Next.js server runtime)
 * ==============================================
 *
 * Server-side Firestore for Server Components / Route Handlers /
 * Server Actions. The Admin SDK uses gRPC over a short-lived HTTP
 * request (no persistent WebChannel stream), so it does NOT suffer
 * from the "client is offline" / "Listen channel" errors that the
 * Web SDK gets when run inside Node.js.
 *
 * Credentials are loaded from the FIRST matching source:
 *   1. `FIREBASE_SERVICE_ACCOUNT_KEY` env var (raw JSON or base64)
 *      → set this in `.env.local` for local dev or in your hosting
 *        provider's env-var settings for production (Vercel, etc.)
 *   2. `FIREBASE_SERVICE_ACCOUNT_PATH` env var
 *   3. `GOOGLE_APPLICATION_CREDENTIALS` env var (Google standard)
 *   4. `./serviceAccountKey.json` in the project root (gitignored)
 *
 * Next.js auto-loads `.env.local` into `process.env` for both
 * build and runtime, so option (1) Just Works in dev. In Vercel,
 * set `FIREBASE_SERVICE_ACCOUNT_KEY` (or one of the other vars) in
 * the project's environment variables.
 *
 * If no credentials are present, `getAdminDb()` returns `null` and
 * the calling code falls back to the bundled `app/lib/wallpapers.ts`
 * static data. The page does not crash; it just renders from the
 * static dataset.
 *
 * A one-time log is emitted on first init so it's clear which
 * credential source was actually used.
 *
 * IMPORTANT: this module imports `firebase-admin`, which is a
 * Node.js dependency. It must NEVER be imported into a client
 * component. The top-level `import "server-only"` enforces that
 * at build time.
 */

import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  initializeApp,
  getApps,
  applicationDefault,
  cert,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

type CredentialSource =
  | "FIREBASE_SERVICE_ACCOUNT_KEY"
  | "FIREBASE_SERVICE_ACCOUNT_PATH"
  | "GOOGLE_APPLICATION_CREDENTIALS"
  | "serviceAccountKey.json"
  | "applicationDefault"
  | "none";

let appInstance: App | undefined;
let dbInstance: Firestore | undefined;
let dbSettingsApplied = false;
let initAttempted = false;
let initError: Error | null = null;
let initSource: CredentialSource | null = null;
let loadedProjectId: string | null = null;

/**
 * Detect which credential source is available and load the
 * service account JSON. Returns `null` if no source is configured
 * (the caller should then try `applicationDefault()` for cloud
 * environments with implicit credentials).
 */
function loadServiceAccount(): {
  account: ServiceAccount;
  source: Exclude<CredentialSource, "applicationDefault" | "none">;
} | null {
  // 1. Inline JSON env var (preferred for Vercel / .env.local)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    // Accept either raw JSON (`{...}`) or base64-encoded JSON.
    const json = raw.startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf-8");
    return {
      account: JSON.parse(json) as ServiceAccount,
      source: "FIREBASE_SERVICE_ACCOUNT_KEY",
    };
  }

  // 2. Explicit file path env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const path = resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (!existsSync(path)) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_PATH="${path}" does not exist.`
      );
    }
    return {
      account: JSON.parse(readFileSync(path, "utf-8")) as ServiceAccount,
      source: "FIREBASE_SERVICE_ACCOUNT_PATH",
    };
  }

  // 3. Google ADC env var
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const adc = resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (!existsSync(adc)) {
      throw new Error(
        `GOOGLE_APPLICATION_CREDENTIALS="${adc}" does not exist.`
      );
    }
    return {
      account: JSON.parse(readFileSync(adc, "utf-8")) as ServiceAccount,
      source: "GOOGLE_APPLICATION_CREDENTIALS",
    };
  }

  // 4. Local convenience file (gitignored)
  const localKey = resolve(process.cwd(), "serviceAccountKey.json");
  if (existsSync(localKey)) {
    return {
      account: JSON.parse(readFileSync(localKey, "utf-8")) as ServiceAccount,
      source: "serviceAccountKey.json",
    };
  }

  return null;
}

function tryInit(): App | null {
  if (appInstance) return appInstance;
  if (initAttempted && !appInstance) return null;
  initAttempted = true;

  const existing = getApps()[0];
  if (existing) {
    appInstance = existing;
    initSource = "applicationDefault";
    logInitResult(initSource, null);
    return existing;
  }

  try {
    const loaded = loadServiceAccount();
    if (loaded) {
      appInstance = initializeApp({ credential: cert(loaded.account) });
      initSource = loaded.source;
      loadedProjectId = loaded.account.projectId ?? null;
      logInitResult(initSource, null);
      return appInstance;
    }

    // No explicit creds on disk. For GCP / Cloud Run / Cloud Functions
    // the runtime can still have implicit credentials via metadata
    // server (applicationDefault()).
    appInstance = initializeApp({ credential: applicationDefault() });
    initSource = "applicationDefault";
    logInitResult(initSource, null);
    return appInstance;
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    initSource = "none";
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[firebase-admin] failed to initialize, falling back to Web SDK / static data:",
        initError.message
      );
    }
    return null;
  }
}

function logInitResult(source: CredentialSource, err: Error | null) {
  if (process.env.NODE_ENV === "test") return;
  if (err) {
    console.warn(
      `[firebase-admin] init failed (source=${source}): ${err.message}`
    );
    return;
  }
  if (source === "none") {
    console.warn(
      "[firebase-admin] no credentials found. Server reads will fall back to static data.\n" +
        "Set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local (recommended) or drop a serviceAccountKey.json in the project root."
    );
    return;
  }
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[firebase-admin] initialized using ${source} (project=${loadedProjectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "unknown"})`
    );
  } else {
    console.log(`[firebase-admin] initialized using ${source}`);
  }
}

/**
 * Get the Admin SDK Firestore instance, or `null` if credentials
 * are not configured. Callers MUST handle `null` (typically by
 * falling back to the bundled static data, or rendering a 404).
 */
export function getAdminDb(): Firestore | null {
  if (dbInstance) return dbInstance;
  const app = tryInit();
  if (!app) return null;
  dbInstance = getFirestore(app);
  if (!dbSettingsApplied) {
    try {
      dbInstance.settings({ ignoreUndefinedProperties: true });
    } catch {
      // settings() can only be applied once per instance.
    }
    dbSettingsApplied = true;
  }
  return dbInstance;
}

/**
 * Returns the last initialization error (if any). Useful for
 * surfacing a one-time warning in `app/error.tsx` or similar.
 */
export function getAdminInitError(): Error | null {
  return initError;
}

/**
 * Returns which credential source was used to initialize the
 * Admin SDK (`null` if not yet initialized).
 */
export function getAdminInitSource(): CredentialSource | null {
  return initSource;
}
