import { Loader2, History } from "lucide-react";

export default function EditsLoading() {
  return (
    <div className="recent-edits-loading">
      <History size={32} className="recent-edits-loading-icon" />
      <Loader2 size={20} className="recent-edits-loading-spin" />
      <p>Loading recent edits…</p>
      <style>{`
        .recent-edits-loading {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: var(--muted-foreground, #9ca3af);
        }
        .recent-edits-loading-icon { color: var(--primary, #00ff84); }
        .recent-edits-loading-spin { animation: spin 1s linear infinite; opacity: 0.7; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
