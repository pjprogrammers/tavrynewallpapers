import {
  auth,
  db
} from "./firebase";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  User,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

/* =========================================================
   🔐 SECURITY HELPERS
========================================================= */

/**
 * Clean email input (prevents garbage input)
 */
const sanitizeEmail = (email: string) => {
  return email.trim().toLowerCase();
};

/**
 * Strong password validator (production standard)
 */
const validatePassword = (password: string, email?: string): string | null => {
  if (!password) return "Password is required.";

  if (password.length < 10) {
    return "Password must be at least 10 characters long.";
  }

  if (password.length > 128) {
    return "Password is too long.";
  }

  if (/\s/.test(password)) {
    return "Password cannot contain spaces.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include at least 1 uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include at least 1 lowercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must include at least 1 number.";
  }

  if (!/[!@#$%^&*(),.?\":{}|<>_\-+=]/.test(password)) {
    return "Password must include at least 1 special character.";
  }

  const weakPasswords = [
    "1234567890",
    "123456789",
    "password",
    "password123",
    "qwerty",
    "1111111111",
    "0000000000"
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    return "This password is too common. Choose a stronger one.";
  }

  // prevent using email inside password
  if (email && password.toLowerCase().includes(email.split("@")[0])) {
    return "Password should not contain your email or name.";
  }

  // repeated characters check (aaaaaa, 111111)
  if (/^(.)\1+$/.test(password)) {
    return "Password cannot be repetitive.";
  }

  return null;
};

/* =========================================================
   🔥 ERROR HANDLING
========================================================= */

const getAuthErrorMessage = (
  errorCode: string
): string => {
  switch (errorCode) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";

    case "auth/email-already-in-use":
      return "An account with this email already exists.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/weak-password":
      return "Password is too weak.";

    case "auth/popup-closed-by-user":
      return "Authentication popup was closed.";

    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Network error. Check your internet connection.";

    default:
      return "Something went wrong. Please try again.";
  }
};

/* =========================================================
   🔐 SIGN IN
========================================================= */

export const signInWithEmail = async (
  email: string,
  password: string
) => {
  try {
    const cleanEmail = sanitizeEmail(email);

    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

    const user = userCredential.user;

    if (!user.emailVerified) {
      return {
        user: null,
        error: "Please verify your email before signing in."
      };
    }

    await updateUserLastLogin(user.uid);

    return { user, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: getAuthErrorMessage(error.code)
    };
  }
};

/* =========================================================
   🧾 SIGN UP (SECURITY ADDED HERE)
========================================================= */

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
) => {
  try {
    const cleanEmail = sanitizeEmail(email);

    /* 🔐 PASSWORD VALIDATION */
    const passwordError = validatePassword(password, cleanEmail);

    if (passwordError) {
      return {
        user: null,
        error: passwordError
      };
    }

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

    const user = userCredential.user;

    await updateProfile(user, {
      displayName
    });

    await sendEmailVerification(user);

    await createUserDocument(user);

    return {
      user,
      error: null
    };
  } catch (error: any) {
    return {
      user: null,
      error: getAuthErrorMessage(error.code)
    };
  }
};

/* =========================================================
   🔵 GOOGLE LOGIN
========================================================= */

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();

    const userCredential =
      await signInWithPopup(auth, provider);

    const user = userCredential.user;

    await upsertUserDocument(user);
    await updateUserLastLogin(user.uid);

    return { user, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: getAuthErrorMessage(error.code)
    };
  }
};

/* =========================================================
   🐙 GITHUB LOGIN
========================================================= */

export const signInWithGitHub = async () => {
  try {
    const provider = new GithubAuthProvider();

    const userCredential =
      await signInWithPopup(auth, provider);

    const user = userCredential.user;

    await upsertUserDocument(user);
    await updateUserLastLogin(user.uid);

    return { user, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: getAuthErrorMessage(error.code)
    };
  }
};

/* =========================================================
   🚪 SIGN OUT
========================================================= */

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch {
    return { error: "Failed to sign out." };
  }
};

/* =========================================================
   🔁 PASSWORD RESET
========================================================= */

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, sanitizeEmail(email));
    return { error: null };
  } catch (error: any) {
    return {
      error: getAuthErrorMessage(error.code)
    };
  }
};

/* =========================================================
   🧠 FIRESTORE USERS
========================================================= */

const createUserDocument = async (user: User) => {
  const userRef = doc(db, "users", user.uid);

  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      provider: user.providerData[0]?.providerId || "",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
  }
};

const upsertUserDocument = async (user: User) => {
  const userRef = doc(db, "users", user.uid);

  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    await updateDoc(userRef, {
      lastLogin: serverTimestamp()
    });
  } else {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      provider: user.providerData[0]?.providerId || "",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
  }
};

const updateUserLastLogin = async (uid: string) => {
  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    lastLogin: serverTimestamp()
  });
};

export default {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithGitHub,
  signOut,
  resetPassword
};