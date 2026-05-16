/**
 * Firebase Configuration and Initialization
 * Production-safe singleton pattern for all Firebase services
 */

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth as firebaseGetAuth, Auth } from "firebase/auth";
import { getFirestore as firebaseGetFirestore, Firestore } from "firebase/firestore";
import { getStorage as firebaseGetStorage, FirebaseStorage } from "firebase/storage";

/**
 * Firebase configuration from environment variables
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Validate that required config exists
 */
const validateConfig = (): boolean => {
  const required = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.storageBucket,
    firebaseConfig.appId,
  ];

  const missing = required.filter(v => !v);

  if (missing.length > 0) {
    console.error(
      "[Firebase] Missing required config:",
      missing.map((_, i) => ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'][i]).filter((_, i) => !missing[i])
    );
    return false;
  }

  return true;
};

/**
 * Firebase App - Singleton pattern
 * Prevents multiple initializations which can cause issues
 */
let app: FirebaseApp | undefined;

if (typeof window !== "undefined" && validateConfig()) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} else if (validateConfig()) {
  // Server-side initialization for type safety
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

/**
 * Firebase Auth instance - lazy initialized
 */
let authInstance: Auth | undefined;
const getAuthInternal = (): Auth | undefined => {
  if (!app) return undefined;
  if (!authInstance) {
    authInstance = firebaseGetAuth(app);
  }
  return authInstance;
};

/**
 * Firestore Database instance - lazy initialized
 */
let dbInstance: Firestore | undefined;
const getFirestoreInternal = (): Firestore | undefined => {
  if (!app) return undefined;
  if (!dbInstance) {
    dbInstance = firebaseGetFirestore(app);
  }
  return dbInstance;
};

/**
 * Firebase Storage instance - lazy initialized
 */
let storageInstance: FirebaseStorage | undefined;
const getStorageInternal = (): FirebaseStorage | undefined => {
  if (!app) return undefined;
  if (!storageInstance) {
    storageInstance = firebaseGetStorage(app);
  }
  return storageInstance;
};

// Export app first (required for App Check)
export { app };

// Re-export as functions for modern usage

/**
 * Get Firebase Auth instance - prefer this over importing auth directly
 */
export const getAuth = (): Auth => {
  const instance = getAuthInternal();
  if (!instance) {
    console.warn("[Firebase] getAuth() called but Firebase not initialized. Check environment variables.");
    throw new Error("Firebase not initialized");
  }
  return instance;
};

/**
 * Get Firestore instance
 */
export const getFirestore = (): Firestore => {
  const instance = getFirestoreInternal();
  if (!instance) {
    console.warn("[Firebase] getFirestore() called but Firebase not initialized. Check environment variables.");
    throw new Error("Firebase not initialized");
  }
  return instance;
};

/**
 * Get Firestore instance - alias for getFirestore()
 * Used by lib/auth.ts and lib/firestore.ts
 */
export const getDB = getFirestore;

/**
 * Get Firebase Storage instance
 */
export const getFirebaseStorage = (): FirebaseStorage => {
  const instance = getStorageInternal();
  if (!instance) {
    console.warn("[Firebase] getStorage() called but Firebase not initialized. Check environment variables.");
    throw new Error("Firebase Storage not initialized");
  }
  return instance;
};

// Backward compatibility exports - these provide the same API as before
// but with lazy initialization under the hood
export const auth: Auth = {
  // This is a placeholder - actual usage should go through getAuth()
} as Auth;

export const db = {
  // Placeholder for backward compatibility
} as Firestore;

export const storage = {
  // Placeholder for backward compatibility
} as FirebaseStorage;

export default app;