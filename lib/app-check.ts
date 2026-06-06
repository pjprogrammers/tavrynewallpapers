/**
 * Firebase App Check Integration
 * Protects Firebase services (Firestore, Storage) with reCAPTCHA.
 *
 * Provider resolution (highest priority first):
 *   1. NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY -> ReCaptchaEnterpriseProvider
 *   2. NEXT_PUBLIC_RECAPTCHA_SITE_KEY            -> ReCaptchaV3Provider
 *
 * The site key and the provider are resolved from the *same* environment
 * variable so they can never disagree.
 *
 * Notes
 * - This module is safe to import on the server. No browser work happens
 *   until initializeAppCheck() is invoked from a client component.
 * - On localhost / 127.0.0.1 / *.local a Firebase App Check debug token is
 *   enabled automatically so local development does not require a real
 *   reCAPTCHA exchange. The debug token is printed to the browser console
 *   the first time Firebase generates one — register it under
 *   Firebase Console → App Check → your web app → "Manage debug tokens".
 * - reCAPTCHA Enterprise loads its script from
 *   https://www.google.com/recaptcha/enterprise.js and renders a challenge
 *   iframe served from https://www.google.com (and assets from
 *   https://www.gstatic.com). The Content-Security-Policy in proxy.ts
 *   must allow these origins, otherwise App Check will silently fail to
 *   fetch a token and every Firestore/Storage request will be rejected.
 */

import {
  initializeAppCheck as initAppCheck,
  ReCaptchaV3Provider,
  ReCaptchaEnterpriseProvider,
  AppCheck,
} from "firebase/app-check";
import { app } from "./firebase";

type ProviderKind = "enterprise" | "v3";

let appCheckInstance: AppCheck | undefined;
let isInitialized = false;
let initializationError: string | undefined;
let activeProvider: ProviderKind | undefined;
let activeSiteKey: string | undefined;

const isBrowser = (): boolean => typeof window !== "undefined";

const isDevelopment = (): boolean => process.env.NODE_ENV === "development";

/**
 * Pick the provider and the site key from the same env var. Enterprise wins
 * over V3 when both are set, matching the documented priority.
 */
const resolveProvider = ():
  | { kind: ProviderKind; siteKey: string }
  | undefined => {
  const enterpriseKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (enterpriseKey && enterpriseKey.trim().length > 0) {
    return { kind: "enterprise", siteKey: enterpriseKey };
  }
  const v3Key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (v3Key && v3Key.trim().length > 0) {
    return { kind: "v3", siteKey: v3Key };
  }
  return undefined;
};

/**
 * Detect hosts where a Firebase App Check debug token is appropriate.
 * Local development and Vercel preview deployments are the only places
 * we want to skip the real reCAPTCHA exchange.
 */
const isLocalLikeHost = (host: string): boolean => {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.endsWith(".vercel.app")
  );
};

/**
 * Enable the Firebase App Check debug token so Firestore/Storage calls work
 * locally without a real reCAPTCHA verification. The actual token is
 * generated and printed to the console by the Firebase SDK the first time
 * it is requested.
 */
const enableDebugTokenIfLocal = (): boolean => {
  if (!isBrowser()) return false;
  const host = window.location.hostname;
  const isLocal = isDevelopment() || isLocalLikeHost(host);
  if (!isLocal) return false;

  (window as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
    true;
  return true;
};

const log = (
  level: "info" | "warn" | "error",
  message: string,
  color: string
): void => {
  const tag = "%c[App Check]";
  const style = `color: ${color}; font-weight: bold;`;
  if (level === "info") console.info(tag, style, message);
  else if (level === "warn") console.warn(tag, style, message);
  else console.error(tag, style, message);
};

/**
 * Subscribe to App Check token lifecycle events so failures surface in the
 * console instead of disappearing silently.
 *
 * NOTE: The public `AppCheck` type in firebase@12 doesn't expose
 * `onTokenChanged`; that method is only on the internal type. The public
 * API expects consumers to call `getToken()` on demand. We use a soft cast
 * so this works on both old and new SDK versions.
 */
const attachTokenListener = (instance: AppCheck): void => {
  const internalInstance = instance as unknown as {
    onTokenChanged?: (
      onNext: (token: { expireTimeMillis: number } | null) => void,
      onError?: (err: { message?: string }) => void
    ) => void;
  };

  if (typeof internalInstance.onTokenChanged !== "function") {
    return;
  }

  try {
    internalInstance.onTokenChanged(
      (token) => {
        if (!token) return;
        const expiresInSec = Math.max(
          0,
          Math.round((token.expireTimeMillis - Date.now()) / 1000)
        );
        log(
          "info",
          `Token refreshed (valid for ~${expiresInSec}s).`,
          "#10b981"
        );
      },
      (err) => {
        log(
          "warn",
          `Token refresh failed: ${err?.message ?? String(err)}`,
          "#f59e0b"
        );
      }
    );
  } catch (err) {
    log(
      "warn",
      `Could not attach token listener: ${
        err instanceof Error ? err.message : String(err)
      }`,
      "#f59e0b"
    );
  }
};

/**
 * Initialize Firebase App Check. Safe to call multiple times — subsequent
 * invocations return the cached instance.
 */
export const initializeAppCheck = async (): Promise<AppCheck | undefined> => {
  if (isInitialized) return appCheckInstance;

  if (!isBrowser()) {
    log("info", "Skipping initialization (server-side).", "#94a3b8");
    return undefined;
  }

  if (!app) {
    initializationError =
      "Firebase app is not initialized — cannot enable App Check. Check NEXT_PUBLIC_FIREBASE_* env vars.";
    log("error", initializationError, "#ef4444");
    return undefined;
  }

  const resolved = resolveProvider();
  if (!resolved) {
    initializationError =
      "No reCAPTCHA site key found. Set NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY (preferred) or NEXT_PUBLIC_RECAPTCHA_SITE_KEY.";
    log("error", initializationError, "#ef4444");
    if (!isDevelopment()) {
      log(
        "error",
        "Production build is running without an App Check key — Firestore/Storage requests will be rejected.",
        "#ef4444"
      );
    }
    return undefined;
  }

  const debugEnabled = enableDebugTokenIfLocal();

  try {
    const provider =
      resolved.kind === "enterprise"
        ? new ReCaptchaEnterpriseProvider(resolved.siteKey)
        : new ReCaptchaV3Provider(resolved.siteKey);

    appCheckInstance = initAppCheck(app, {
      provider,
      isTokenAutoRefreshEnabled: true,
    });

    isInitialized = true;
    activeProvider = resolved.kind;
    activeSiteKey = resolved.siteKey;
    initializationError = undefined;

    const providerName =
      resolved.kind === "enterprise" ? "Enterprise" : "V3";
    const maskedKey = `${resolved.siteKey.slice(0, 8)}…${resolved.siteKey.slice(-4)}`;
    log(
      "info",
      `Initialized with ReCaptcha${providerName}Provider (site key ${maskedKey})${
        debugEnabled ? " [debug token enabled]" : ""
      }.`,
      "#10b981"
    );

    attachTokenListener(appCheckInstance);
    return appCheckInstance;
  } catch (err) {
    initializationError = err instanceof Error ? err.message : String(err);
    log(
      "error",
      `Initialization failed: ${initializationError}`,
      "#ef4444"
    );
    return undefined;
  }
};

/** Alias for backward compatibility. */
export const setupAppCheck = initializeAppCheck;

/** Returns the current App Check instance, or undefined if not initialized. */
export const getAppCheckInstance = (): AppCheck | undefined => appCheckInstance;

/** True once App Check has been successfully initialized in this session. */
export const isAppCheckInitialized = (): boolean => isInitialized;

/** Returns the last initialization error, if any. */
export const getAppCheckError = (): string | undefined => initializationError;

/** Returns the active provider kind ("enterprise" or "v3"), if initialized. */
export const getActiveProvider = (): ProviderKind | undefined => activeProvider;

/** Returns the active site key, if initialized. */
export const getActiveSiteKey = (): string | undefined => activeSiteKey;

/**
 * Force a fresh initialization. Useful when the env vars change at runtime
 * (e.g., debug token toggling) or when debugging.
 */
export const reinitializeAppCheck = async (): Promise<AppCheck | undefined> => {
  isInitialized = false;
  appCheckInstance = undefined;
  activeProvider = undefined;
  activeSiteKey = undefined;
  initializationError = undefined;
  return initializeAppCheck();
};

export default {
  initializeAppCheck,
  setupAppCheck,
  getAppCheckInstance,
  isAppCheckInitialized,
  getAppCheckError,
  getActiveProvider,
  getActiveSiteKey,
  reinitializeAppCheck,
};
