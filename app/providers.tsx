"use client";

import { useEffect, useState } from "react";

import { initializeAppCheck, isAppCheckInitialized } from "@/lib/app-check";

type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const [appCheckReady, setAppCheckReady] = useState(false);

  useEffect(() => {
    // Initialize App Check on mount
    const initAppCheck = async () => {
      // Skip if already initialized
      if (isAppCheckInitialized()) {
        setAppCheckReady(true);
        return;
      }

      try {
        await initializeAppCheck();
      } catch (error) {
        // Graceful failure - don't block the app
        console.warn("[Providers] App Check initialization failed:", error);
      }

      setAppCheckReady(true);
    };

    initAppCheck();
  }, []);

  // Render children even if App Check isn't ready
  // This ensures the app works even if App Check fails
  return <>{children}</>;
}