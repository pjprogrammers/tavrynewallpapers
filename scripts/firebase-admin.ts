/**
 * 🔥 FIREBASE ADMIN SDK INITIALIZATION (for npm scripts)
 * =======================================================
 *
 * Shared helper used by the CLI scripts under `scripts/`.
 * Loads the service account JSON and exposes typed `adminAuth()`
 * and `adminDb()` helpers.
 *
 * Configuration is read (in order) from:
 *  1. `FIREBASE_SERVICE_ACCOUNT_KEY` env var (raw JSON or base64)
 *  2. `FIREBASE_SERVICE_ACCOUNT_PATH` env var (path to JSON file)
 *  3. `GOOGLE_APPLICATION_CREDENTIALS` env var (Google standard)
 *  4. `./serviceAccountKey.json` (local convenience, gitignored)
 */

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
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let appInstance: App | undefined;

function loadServiceAccount(): ServiceAccount {
  // 1. Inline JSON (raw or base64)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    const json = raw.startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf-8");
    return JSON.parse(json) as ServiceAccount;
  }

  // 2. Explicit path
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const path = resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (!existsSync(path)) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_PATH="${path}" does not exist.`
      );
    }
    return JSON.parse(readFileSync(path, "utf-8")) as ServiceAccount;
  }

  // 3. Google ADC env var
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const adc = resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (!existsSync(adc)) {
      throw new Error(
        `GOOGLE_APPLICATION_CREDENTIALS="${adc}" does not exist.`
      );
    }
    return JSON.parse(readFileSync(adc, "utf-8")) as ServiceAccount;
  }

  // 4. Local default file
  const localKey = resolve(process.cwd(), "serviceAccountKey.json");
  if (existsSync(localKey)) {
    return JSON.parse(readFileSync(localKey, "utf-8")) as ServiceAccount;
  }

  throw new Error(
    [
      "",
      "❌ Firebase Admin credentials not found.",
      "",
      "Set one of the following before running this script:",
      "  • FIREBASE_SERVICE_ACCOUNT_KEY  (raw JSON or base64)",
      "  • FIREBASE_SERVICE_ACCOUNT_PATH  (path to a JSON key file)",
      "  • GOOGLE_APPLICATION_CREDENTIALS  (Google standard)",
      "  • Place serviceAccountKey.json in the project root (gitignored).",
      "",
      "See .env.example for the full list of variables.",
      "",
    ].join("\n")
  );
}

export function getApp(): App {
  if (appInstance) return appInstance;
  const existing = getApps()[0];
  if (existing) {
    appInstance = existing;
    return existing;
  }

  let credential;
  try {
    credential = cert(loadServiceAccount());
  } catch (err) {
    if (
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      existsSync(resolve(process.cwd(), "serviceAccountKey.json"))
    ) {
      appInstance = initializeApp({ credential: applicationDefault() });
      return appInstance;
    }
    throw err;
  }

  appInstance = initializeApp({ credential });
  return appInstance;
}

export function adminAuth(): Auth {
  return getAuth(getApp());
}

let dbInstance: Firestore | undefined;
let dbSettingsApplied = false;

export function adminDb(): Firestore {
  if (dbInstance) return dbInstance;
  dbInstance = getFirestore(getApp());
  if (!dbSettingsApplied) {
    // Defense in depth: tolerate undefined values in seed/edit payloads.
    // settings() can only be called once per Firestore instance, so we
    // guard it. After the first call, subsequent adminDb() calls reuse
    // the same instance with the setting already in effect.
    try {
      dbInstance.settings({ ignoreUndefinedProperties: true });
    } catch {
      // Already configured — ignore.
    }
    dbSettingsApplied = true;
  }
  return dbInstance;
}
