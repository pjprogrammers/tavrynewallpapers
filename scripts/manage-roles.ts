/**
 * 🛡️  npm run role
 * ==================
 *
 * Manage user roles (admin / moderator) for the Tavryne Wallpapers
 * Firebase project.
 *
 * Usage:
 *   npm run role add    <email> <role> [role...]   Add roles to a user
 *   npm run role remove <email> <role> [role...]   Remove roles from a user
 *   npm run role set    <email> <role> [role...]   Replace user's roles
 *   npm run role clear  <email>                    Remove all roles
 *   npm run role get    <email>                    Get a user's current roles
 *   npm run role list   [admin|moderator]          List all users with any/specific role
 *   npm run role help                              Show this help
 *
 * Roles:
 *   - admin     : Full access. Can edit wallpapers AND manage roles.
 *   - moderator : Can edit any wallpaper's metadata. Cannot manage roles.
 *
 * Credentials (any one of):
 *   - FIREBASE_SERVICE_ACCOUNT_KEY   (raw JSON or base64)
 *   - FIREBASE_SERVICE_ACCOUNT_PATH  (path to a JSON file)
 *   - GOOGLE_APPLICATION_CREDENTIALS (Google standard)
 *   - ./serviceAccountKey.json       (local convenience, gitignored)
 *
 * Examples:
 *   npm run role add me@example.com admin moderator
 *   npm run role remove other@example.com moderator
 *   npm run role set me@example.com admin
 *   npm run role get someone@example.com
 *   npm run role list admin
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

import { adminAuth, adminDb } from "./firebase-admin";
import { ALL_ROLES, isUserRole, toUserRoles, fromUserRoles } from "../lib/roles";
import { COLLECTIONS, type UserProfile, type UserRoles, type UserRole } from "../lib/firestore-types";

/* =========================================================
   🎨 CONSOLE HELPERS
========================================================= */

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

const ok = (msg: string) => console.log(`${C.green}✓${C.reset} ${msg}`);
const info = (msg: string) => console.log(`${C.cyan}ℹ${C.reset} ${msg}`);
const warn = (msg: string) => console.log(`${C.yellow}⚠${C.reset} ${msg}`);
const err = (msg: string) => console.log(`${C.red}✗${C.reset} ${msg}`);

const fmtRoles = (roles: UserRole[]): string =>
  roles.length === 0 ? `${C.dim}(none)${C.reset}` : roles.map((r) => `${C.bold}${r}${C.reset}`).join(", ");

/* =========================================================
   🔐 FIREBASE OPERATIONS
========================================================= */

async function findUserByEmail(email: string) {
  try {
    return await adminAuth().getUserByEmail(email);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "auth/user-not-found") return null;
    throw e;
  }
}

async function setCustomClaimsAndMirror(
  uid: string,
  email: string,
  roles: UserRole[],
  updatedBy?: string
): Promise<void> {
  const rolesObj = toUserRoles(roles, updatedBy);

  // 1. Set custom claims
  await adminAuth().setCustomUserClaims(uid, {
    admin: rolesObj.admin,
    moderator: rolesObj.moderator,
  });

  // 2. Mirror to the user document so client-side UI can read roles
  //    without an ID-token refresh. We do NOT touch other user fields.
  const userRef = adminDb().collection(COLLECTIONS.USERS).doc(uid);
  const snap = await userRef.get();

  if (snap.exists) {
    await userRef.update({
      roles: rolesObj,
    });
  } else {
    // Create a minimal user document. The user will get a richer profile
    // the first time they sign in.
    await userRef.set({
      uid,
      email,
      displayName: email.split("@")[0],
      photoURL: "",
      provider: "password",
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date(),
      roles: rolesObj,
    });
  }
}

/* =========================================================
   🧰 COMMANDS
========================================================= */

async function cmdAdd(email: string, rolesInput: string[]) {
  const roles = rolesInput.filter(isUserRole);
  const invalid = rolesInput.filter((r) => !isUserRole(r));

  if (invalid.length > 0) {
    err(`Invalid role(s): ${invalid.join(", ")}. Allowed: ${ALL_ROLES.join(", ")}`);
    process.exitCode = 1;
    return;
  }
  if (roles.length === 0) {
    err("Please provide at least one role to add.");
    process.exitCode = 1;
    return;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    err(`No Firebase Auth user found with email "${email}".`);
    process.exitCode = 1;
    return;
  }

  const existing = fromUserRoles(user.customClaims as UserRoles | undefined);
  const merged = Array.from(new Set([...existing, ...roles]));

  info(`Current roles for ${C.bold}${email}${C.reset} (uid ${user.uid}): ${fmtRoles(existing)}`);
  await setCustomClaimsAndMirror(user.uid, user.email!, merged, "cli");
  ok(`Updated roles for ${email}: ${fmtRoles(merged)}`);
  info("Custom claims will appear in the user's next ID-token refresh (max 1h).");
  info("The user can also call `getIdToken(true)` in the browser to force refresh.");
}

async function cmdRemove(email: string, rolesInput: string[]) {
  const roles = rolesInput.filter(isUserRole);
  const invalid = rolesInput.filter((r) => !isUserRole(r));

  if (invalid.length > 0) {
    err(`Invalid role(s): ${invalid.join(", ")}. Allowed: ${ALL_ROLES.join(", ")}`);
    process.exitCode = 1;
    return;
  }
  if (roles.length === 0) {
    err("Please provide at least one role to remove.");
    process.exitCode = 1;
    return;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    err(`No Firebase Auth user found with email "${email}".`);
    process.exitCode = 1;
    return;
  }

  const existing = fromUserRoles(user.customClaims as UserRoles | undefined);
  const next = existing.filter((r) => !roles.includes(r));

  info(`Current roles for ${C.bold}${email}${C.reset}: ${fmtRoles(existing)}`);
  await setCustomClaimsAndMirror(user.uid, user.email!, next, "cli");
  ok(`Updated roles for ${email}: ${fmtRoles(next)}`);
}

async function cmdSet(email: string, rolesInput: string[]) {
  const roles = rolesInput.filter(isUserRole);
  const invalid = rolesInput.filter((r) => !isUserRole(r));

  if (invalid.length > 0) {
    err(`Invalid role(s): ${invalid.join(", ")}. Allowed: ${ALL_ROLES.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    err(`No Firebase Auth user found with email "${email}".`);
    process.exitCode = 1;
    return;
  }

  const existing = fromUserRoles(user.customClaims as UserRoles | undefined);
  const dedup = Array.from(new Set(roles));

  info(`Current roles for ${C.bold}${email}${C.reset}: ${fmtRoles(existing)}`);
  await setCustomClaimsAndMirror(user.uid, user.email!, dedup, "cli");
  ok(`Set roles for ${email}: ${fmtRoles(dedup)}`);
}

async function cmdClear(email: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    err(`No Firebase Auth user found with email "${email}".`);
    process.exitCode = 1;
    return;
  }
  await setCustomClaimsAndMirror(user.uid, user.email!, [], "cli");
  ok(`Cleared all roles for ${email}`);
}

async function cmdGet(email: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    err(`No Firebase Auth user found with email "${email}".`);
    process.exitCode = 1;
    return;
  }
  const roles = fromUserRoles(user.customClaims as UserRoles | undefined);
  // Also check the user document mirror
  let mirror: UserRole[] = [];
  try {
    const snap = await adminDb().collection(COLLECTIONS.USERS).doc(user.uid).get();
    if (snap.exists) {
      const data = snap.data() as UserProfile | undefined;
      mirror = fromUserRoles(data?.roles);
    }
  } catch {
    /* mirror read failure is non-fatal */
  }

  console.log();
  console.log(`${C.bold}Email:${C.reset}    ${user.email}`);
  console.log(`${C.bold}UID:${C.reset}       ${user.uid}`);
  console.log(`${C.bold}Display:${C.reset}   ${user.displayName || C.dim + "(none)" + C.reset}`);
  console.log(`${C.bold}Verified:${C.reset}  ${user.emailVerified ? C.green + "yes" + C.reset : C.yellow + "no" + C.reset}`);
  console.log(`${C.bold}Disabled:${C.reset}  ${user.disabled ? C.red + "yes" + C.reset : C.green + "no" + C.reset}`);
  console.log(`${C.bold}Created:${C.reset}   ${user.metadata.creationTime}`);
  console.log(`${C.bold}Last sign-in:${C.reset} ${user.metadata.lastSignInTime || C.dim + "(never)" + C.reset}`);
  console.log(`${C.bold}Custom claims:${C.reset} ${fmtRoles(roles)}`);
  console.log(`${C.bold}User doc mirror:${C.reset} ${fmtRoles(mirror)}`);
  console.log();
}

async function cmdList(roleFilter?: string) {
  if (roleFilter && !isUserRole(roleFilter)) {
    err(`Invalid role "${roleFilter}". Allowed: ${ALL_ROLES.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  // ListAuthUsers is paginated. Pull up to 1000 in this CLI run.
  const list = await adminAuth().listUsers(1000);
  const target = roleFilter as UserRole | undefined;
  const filtered = list.users
    .map((u) => ({
      user: u,
      roles: fromUserRoles(u.customClaims as UserRoles | undefined),
    }))
    .filter((x) =>
      target ? x.roles.includes(target) : x.roles.length > 0
    )
    .sort((a, b) => a.user.email!.localeCompare(b.user.email!));

  console.log();
  if (filtered.length === 0) {
    info(
      target
        ? `No users with the "${target}" role.`
        : `No users with any role.`
    );
  } else {
    console.log(
      `${C.bold}${filtered.length}${C.reset} user(s) with role(s)${target ? ` "${target}"` : ""}:`
    );
    for (const { user, roles } of filtered) {
      const disabled = user.disabled ? ` ${C.red}[disabled]${C.reset}` : "";
      const unverified = user.emailVerified ? "" : ` ${C.yellow}[unverified]${C.reset}`;
      console.log(
        `  ${C.blue}${user.email}${C.reset}${disabled}${unverified}  ${C.dim}uid=${user.uid}${C.reset}  roles=${fmtRoles(roles)}`
      );
    }
  }
  console.log();
}

/* =========================================================
   📜 HELP
========================================================= */

function printHelp() {
  console.log(`
${C.bold}${C.magenta}npm run role${C.reset} ${C.dim}- manage user roles

${C.bold}USAGE${C.reset}
  npm run role <action> <email> [roles...]

${C.bold}ACTIONS${C.reset}
  ${C.cyan}add${C.reset}    <email> <role> [role...]   Add roles to a user
  ${C.cyan}remove${C.reset} <email> <role> [role...]   Remove roles from a user
  ${C.cyan}set${C.reset}    <email> <role> [role...]   Replace user's roles
  ${C.cyan}clear${C.reset}  <email>                    Remove all roles
  ${C.cyan}get${C.reset}    <email>                    Get a user's current roles
  ${C.cyan}list${C.reset}   [admin|moderator]          List all users with any/specific role
  ${C.cyan}help${C.reset}                              Show this help

${C.bold}ROLES${C.reset}
  ${C.cyan}admin${C.reset}     Full access. Can edit wallpapers AND manage roles.
  ${C.cyan}moderator${C.reset} Can edit any wallpaper's metadata. Cannot manage roles.

${C.bold}EXAMPLES${C.reset}
  ${C.dim}# Grant yourself both admin and moderator${C.reset}
  npm run role add me@example.com admin moderator

  ${C.dim}# Promote someone to admin only${C.reset}
  npm run role set other@example.com admin

  ${C.dim}# Demote someone (remove admin, leave moderator)${C.reset}
  npm run role remove other@example.com admin

  ${C.dim}# Show all moderators${C.reset}
  npm run role list moderator

${C.bold}CREDENTIALS${C.reset}
  Set one of:
    FIREBASE_SERVICE_ACCOUNT_KEY  ${C.dim}(raw JSON or base64)${C.reset}
    FIREBASE_SERVICE_ACCOUNT_PATH ${C.dim}(path to JSON key file)${C.reset}
    GOOGLE_APPLICATION_CREDENTIALS
    Place serviceAccountKey.json in the project root.

  ${C.dim}See .env.example for the full list of variables.${C.reset}
`);
}

/* =========================================================
   🚀 ENTRYPOINT
========================================================= */

async function main() {
  const args = process.argv.slice(2);
  const action = args[0];

  if (!action || action === "help" || action === "--help" || action === "-h") {
    printHelp();
    return;
  }

  const email = args[1];
  const rolesArgs = args.slice(2);

  if (action !== "list" && !email) {
    err(`Action "${action}" requires an email.`);
    err(`Run "npm run role help" for usage.`);
    process.exitCode = 1;
    return;
  }

  try {
    switch (action) {
      case "add":
        await cmdAdd(email, rolesArgs);
        break;
      case "remove":
        await cmdRemove(email, rolesArgs);
        break;
      case "set":
        await cmdSet(email, rolesArgs);
        break;
      case "clear":
        await cmdClear(email);
        break;
      case "get":
        await cmdGet(email);
        break;
      case "list":
        await cmdList(rolesArgs[0]);
        break;
      default:
        err(`Unknown action "${action}".`);
        err(`Run "npm run role help" for usage.`);
        process.exitCode = 1;
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    err(msg);
    process.exitCode = 1;
  }
}

main();
