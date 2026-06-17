"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 p-10">
      <div className="relative">
        <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
        <AlertTriangle size={52} className="text-red-400 relative" />
      </div>
      <h1 className="text-xl font-bold text-zinc-100">Admin error</h1>
      <p className="text-sm text-zinc-400 max-w-md text-center">
        An unexpected error occurred in the admin dashboard. Please try again.
      </p>
      {error.digest && (
        <p className="text-xs text-zinc-600 font-mono">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all"
      >
        <RefreshCw size={16} />
        Try again
      </button>
    </div>
  );
}
