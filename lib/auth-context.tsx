"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { onAuthStateChanged, type User } from "firebase/auth";

import { getAuth } from "./firebase";

/**
 * Auth context type
 */
interface AuthContextType {
  user: User | null;

  loading: boolean;
}

/**
 * Create auth context
 */
const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

/**
 * Auth Provider Component
 */
export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  /**
   * Current authenticated user
   */
  const [user, setUser] = useState<User | null>(null);

  /**
   * Loading state while Firebase checks auth session
   */
  const [loading, setLoading] = useState(true);

  /**
   * Listen for authentication state changes
   */
  useEffect(() => {
    try {
      const authInstance = getAuth();
      const unsubscribe = onAuthStateChanged(
        authInstance,
        (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        }
      );

      /**
       * Cleanup listener
       */
      return () => unsubscribe();
    } catch (error) {
      console.error("[AuthContext] Firebase not initialized:", error);
      setLoading(false);
      return;
    }
  }, []);

  /**
   * Sync Firestore user document when auth state changes
   */
  useEffect(() => {
    if (user && !loading) {
      const syncUser = async () => {
        const { createOrUpdateUser } = await import("./firestore");
        const provider = user.providerData[0]?.providerId || "password";
        await createOrUpdateUser(user.uid, {
          displayName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          provider,
        });
      };
      syncUser();
    }
  }, [user, loading]);

  /**
   * Prevent rendering app before auth finishes loading
   */
  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook for accessing auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};