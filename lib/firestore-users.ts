import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { getDB as getDBInstance } from "./firebase";
import {
  COLLECTIONS,
  UserProfile,
  UserProfilePublic,
} from "./firestore-types";

export { COLLECTIONS } from "./firestore-types";

export const createOrUpdateUser = async (
  userId: string,
  data: {
    displayName: string;
    email: string;
    photoURL: string;
    provider: string;
  }
): Promise<void> => {
  const userRef = doc(getDBInstance(), COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);

  const userData: Omit<UserProfile, "createdAt" | "lastLogin"> & {
    createdAt?: Timestamp;
  } = {
    uid: userId,
    displayName: data.displayName,
    email: data.email,
    photoURL: data.photoURL,
    provider: data.provider as UserProfile["provider"],
    isActive: true,
  };

  if (!userDoc.exists()) {
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
    }, { merge: true });
  }

  await setDoc(userRef, {
    ...userData,
    lastLogin: serverTimestamp(),
  }, { merge: true });
};

export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  const userRef = doc(getDBInstance(), COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();
  return { ...data, uid: data.uid } as UserProfile;
};

export const updateUserProfile = async (
  userId: string,
  data: Partial<Pick<UserProfile, "displayName" | "photoURL">>
): Promise<void> => {
  const userRef = doc(getDBInstance(), COLLECTIONS.USERS, userId);
  const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };

  if (data.displayName !== undefined) {
    updateData.displayName = data.displayName;
  }
  if (data.photoURL !== undefined && data.photoURL !== "") {
    updateData.photoURL = data.photoURL;
  }

  await setDoc(userRef, updateData, { merge: true });
};

export const getPublicUserProfile = async (
  userId: string
): Promise<UserProfilePublic | null> => {
  const userRef = doc(getDBInstance(), COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();
  return {
    uid: data.uid,
    displayName: data.displayName,
    photoURL: data.photoURL,
    createdAt: data.createdAt,
  };
};
