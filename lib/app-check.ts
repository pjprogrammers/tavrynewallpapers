/**
 * Firebase App Check Integration
 * Protects Firebase services (Firestore, Storage) with reCAPTCHA
 *
 * Supports both:
 * - ReCaptchaV3Provider (standard)
 * - ReCaptchaEnterpriseProvider (enterprise)
 *
 * Production-safe implementation:
 * - Client-side only initialization
 * - Singleton pattern to prevent multiple inits
 * - Graceful error handling
 * - Debug token support for development
 */

import {
  initializeAppCheck as initAppCheck,
  ReCaptchaV3Provider,
  ReCaptchaEnterpriseProvider,
  AppCheck,
} from "firebase/app-check";
import { app } from "./firebase";

/**
 * Track initialization state
 */
let appCheckInstance: AppCheck | undefined;
let isInitialized = false;
let initializationError: string | undefined;

/**
 * Get reCAPTCHA site key from environment
 */
const getRecaptchaSiteKey = (): string | undefined => {
  // Check for V3 key first (standard reCAPTCHA)
  const v3Key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (v3Key) return v3Key;

  // Fall back to enterprise key if V3 not available
  const enterpriseKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  return enterpriseKey;
};

/**
 * Check if we're in development mode
 */
const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development";
};

/**
 * Enable debug token for development
 * This allows Firebase to work locally without real reCAPTCHA verification
 */
const enableDebugToken = (): void => {
  if (typeof window !== "undefined" && isDevelopment()) {
    // Firebase App Check debug token - allows local development
    // Token is logged to console - use it in Firebase Console for testing
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;

      }
};

/**
 * Log initialization status
 */
const logInitialization = (success: boolean, message: string): void => {
  const prefix = success
    ? "%c[App Check] Initialized successfully"
    : "%c[App Check] Initialization skipped/failed";
  const color = success ? "color: #10b981; font-weight: bold;" : "color: #f59e0b; font-weight: bold;";

  };

/**
 * Initialize App Check with error handling
 *
 * Supports both V3 and Enterprise providers based on environment:
 * - NEXT_PUBLIC_RECAPTCHA_SITE_KEY -> ReCaptchaV3Provider
 * - NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY -> ReCaptchaEnterpriseProvider
 */
export const initializeAppCheck = async (): Promise<AppCheck | undefined> => {
  // Prevent multiple initializations
  if (isInitialized && appCheckInstance) {
        return appCheckInstance;
  }

  // Client-side only - prevent SSR issues
  if (typeof window === "undefined") {
    logInitialization(false, "Server-side detected, skipping client-only initialization");
    return undefined;
  }

  // Get the appropriate site key
  const siteKey = getRecaptchaSiteKey();
  if (!siteKey) {
    initializationError = "No reCAPTCHA site key found. Set NEXT_PUBLIC_RECAPTCHA_SITE_KEY or NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY";
    console.error("[App Check]", initializationError);

    // In development, we can continue without App Check
    // In production, this is a critical error
    if (!isDevelopment()) {
      console.error("[App Check] CRITICAL: Production build without reCAPTCHA key");
    }

    return undefined;
  }

  // Enable debug token for development
  enableDebugToken();

  // Check which provider to use based on which key is present
  const isEnterprise = !!process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;

  try {
    const provider = isEnterprise
      ? new ReCaptchaEnterpriseProvider(siteKey)
      : new ReCaptchaV3Provider(siteKey);

    appCheckInstance = initAppCheck(app, {
      provider,
      isTokenAutoRefreshEnabled: true,
    });

    isInitialized = true;

    const providerType = isEnterprise ? "Enterprise" : "V3";
    logInitialization(true, `Using ReCaptcha${providerType}Provider`);

    return appCheckInstance;
  } catch (error) {
    initializationError = error instanceof Error ? error.message : "Unknown error";
    console.error("[App Check] Failed to initialize:", initializationError);

    // Don't crash - log and continue
    logInitialization(false, `Error: ${initializationError}`);

    return undefined;
  }
};

/**
 * Re-export setup function for backward compatibility
 */
export const setupAppCheck = initializeAppCheck;

/**
 * Get the current App Check instance
 */
export const getAppCheckInstance = (): AppCheck | undefined => {
  return appCheckInstance;
};

/**
 * Check if App Check is initialized
 */
export const isAppCheckInitialized = (): boolean => {
  return isInitialized;
};

/**
 * Get initialization error if any
 */
export const getAppCheckError = (): string | undefined => {
  return initializationError;
};

/**
 * Force re-initialization (useful for debugging)
 */
export const reinitializeAppCheck = async (): Promise<AppCheck | undefined> => {
  isInitialized = false;
  appCheckInstance = undefined;
  return initializeAppCheck();
};

export default {
  initializeAppCheck,
  setupAppCheck,
  getAppCheckInstance,
  isAppCheckInitialized,
  getAppCheckError,
  reinitializeAppCheck,
};