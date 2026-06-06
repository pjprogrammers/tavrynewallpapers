/**
 * 🔥 FIREBASE ADMIN SDK (server-only)
 * ====================================
 *
 * This module is for SERVER-SIDE use only (npm scripts, server
 * actions, route handlers). It uses the Firebase Admin SDK which
 * bypasses security rules.
 *
 * DO NOT IMPORT FROM CLIENT COMPONENTS.
 *
 * Initialization is lazy and reads credentials from
 * `FIREBASE_SERVICE_ACCOUNT_KEY` (base64-encoded JSON) or from
 * `serviceAccountKey.json` in the project root, in that order.
 */

import "server-only";

import {
  initializeApp,
  getApps,
  getApp,
  cert,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth as adminGetAuth, type Auth } from "firebase-admin/auth";
import { getFirestore as adminGetFirestore, type Firestore } from "firebase-admin/firestore";

let adminAppInstance: App | undefined;
let adminAuthInstance: Auth | undefined;
let adminDbInstance: Firestore | undefined;

function loadServiceAccount(): ServiceAccount {
  // 1. Inline JSON via env var (preferred for Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      // Allow either raw JSON or base64
      const json = raw.startsWith("{")
        ? raw
        : Buffer.from(raw, "base64").toString("utf-8");
      return JSON.parse(json) as ServiceAccount;
    } catch (err) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY env var is set but is not valid JSON: " +
          (err instanceof Error ? err.message : String(err))
      );
    }
  }

  // 2. Path to a key file (convenient for local `npm run role`)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
     
    const fs = require("fs") as typeof import("fs");
    const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (!fs.existsSync(path)) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_PATH points to "${path}" but the file does not exist.`
      );
    }
    const json = fs.readFileSync(path, "utf-8");
    return JSON.parse(json) as ServiceAccount;
  }

  throw new Error(
    "Firebase Admin credentials not found. Set one of:\n" +
      "  - FIREBASE_SERVICE_ACCOUNT_KEY (raw JSON or base64-encoded)\n" +
      "  - FIREBASE_SERVICE_ACCOUNT_PATH (path to a JSON key file)\n" +
      "  - GOOGLE_APPLICATION_CREDENTIALS (Google-standard env var)\n" +
      "See .env.example for details."
  );
}

function initAdminApp(): App {
  if (adminAppInstance) return adminAppInstance;

  const existing = getApps()[0];
  if (existing) {
    adminAppInstance = existing;
    return existing;
  }

  let credential;
  try {
    credential = cert(loadServiceAccount());
  } catch (err) {
    // If GOOGLE_APPLICATION_CREDENTIALS is set, fall back to applicationDefault()
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
       
      const { applicationDefault } = require("firebase-admin/app");
      adminAppInstance = initializeApp({
        credential: applicationDefault(),
      });
      return adminAppInstance;
    }
    throw err;
  }

  adminAppInstance = initializeApp({ credential });
  return adminAppInstance;
}

export function getAdminApp(): App {
  return initAdminApp();
}

export function getAdminAuth(): Auth {
  if (adminAuthInstance) return adminAuthInstance;
  adminAuthInstance = adminGetAuth(initAdminApp());
  return adminAuthInstance;
}

export function getAdminDb(): Firestore {
  if (adminDbInstance) return adminDbInstance;
  adminDbInstance = adminGetFirestore(initAdminApp());
  return adminDbInstance;
}
