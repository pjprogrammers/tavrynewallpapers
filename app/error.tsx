"use client";

/**
 * 🛑 Global error boundary
 * Catches uncaught errors in any route segment and shows a friendly
 * message + a "Try again" button (which calls `reset()` to re-render
 * the failed segment).
 */

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console (in production you would send to Sentry / similar)
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="route-error">
      <AlertTriangle size={48} />
      <h1>Something went wrong</h1>
      <p>
        We hit an unexpected error rendering this page. It has been logged
        with a unique ID we can use to fix it.
      </p>
      {error.digest && (
        <code className="route-error-digest">Error ID: {error.digest}</code>
      )}
      <div className="route-error-actions">
        <button onClick={reset} className="route-error-btn">
          <RefreshCw size={16} /> Try again
        </button>
        <Link href="/" className="route-error-btn route-error-btn-secondary">
          <Home size={16} /> Go home
        </Link>
      </div>
      <style>{`
        .route-error {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 2rem;
          text-align: center;
        }
        .route-error svg { color: #f87171; }
        .route-error h1 { font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0 0; }
        .route-error p { color: var(--muted-foreground, #9ca3af); max-width: 480px; margin: 0; }
        .route-error-digest {
          background: var(--muted, #1a1a1a);
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          color: var(--muted-foreground, #9ca3af);
        }
        .route-error-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .route-error-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          background: var(--primary, #00ff84);
          color: #000;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9rem;
          text-decoration: none;
        }
        .route-error-btn:hover { background: var(--primary-dark, #00cc69); }
        .route-error-btn-secondary {
          background: transparent;
          border: 1px solid var(--border, #27272a);
          color: var(--foreground, #fafafa);
        }
        .route-error-btn-secondary:hover {
          border-color: var(--primary, #00ff84);
          color: var(--primary, #00ff84);
          background: transparent;
        }
      `}</style>
    </div>
  );
}
