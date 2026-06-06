import { Loader2 } from "lucide-react";

/**
 * ⏳ Root loading state
 * Shown while the route segment is being prepared (Suspense boundary).
 */
export default function Loading() {
  return (
    <div className="route-loading">
      <Loader2 size={32} className="route-loading-spin" />
      <p>Loading…</p>
      <style>{`
        .route-loading {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: var(--muted-foreground, #9ca3af);
        }
        .route-loading-spin { animation: spin 1s linear infinite; color: var(--primary, #00ff84); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
