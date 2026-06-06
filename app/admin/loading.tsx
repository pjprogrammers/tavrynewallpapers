import { Loader2, Shield } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="admin-loading">
      <Shield size={32} className="admin-loading-icon" />
      <Loader2 size={20} className="admin-loading-spin" />
      <p>Loading admin dashboard…</p>
      <style>{`
        .admin-loading {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: var(--muted-foreground, #9ca3af);
        }
        .admin-loading-icon { color: var(--primary, #00ff84); }
        .admin-loading-spin { animation: spin 1s linear infinite; opacity: 0.7; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
