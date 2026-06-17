"use client";

/**
 * 📜 RecentEditsContent
 * =====================
 *
 * Public, ISR-friendly view of the latest wallpaper edits.
 * Used by /edits. Subscribes to recent edits across all wallpapers.
 *
 * NOTE: All styles live in `app/globals.css` to avoid the
 * styled-jsx "nested tag" build error.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  History,
  Loader2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { getRecentEditsFromFirestore } from "@/lib/wallpaper-store";
import { createSlug } from "@/lib/slug";
import type { WallpaperEdit } from "@/lib/firestore-types";

export default function RecentEditsContent() {
  const [edits, setEdits] = useState<WallpaperEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getRecentEditsFromFirestore(50)
      .then((list) => {
        if (!cancelled) setEdits(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="recent-edits">
      <header className="recent-edits-header">
        <div>
          <h1>
            <History size={28} />
            Recent Edits
          </h1>
          <p className="recent-edits-sub">
            See what our team has changed across the wallpaper catalog. Edits are
            recorded in real time as moderators update metadata.
          </p>
        </div>
      </header>

      {error && (
        <div className="alert-error" role="alert">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading && edits.length === 0 ? (
        <div className="admin-loading">
          <Loader2 size={24} className="animate-spin" />
          <p>Loading recent edits…</p>
        </div>
      ) : edits.length === 0 ? (
        <div className="empty-state">
          <History size={32} />
          <p>No edits yet. Once moderators start updating wallpapers, you&rsquo;ll see them here.</p>
        </div>
      ) : (
        <ol className="edits-list">
          {edits.map((e) => {
            const t = (e.editedAt as { toDate?: () => Date })?.toDate?.();
            return (
              <li key={e.id} className="edit-row">
                <div className="edit-head">
                  <Link
                    href={`/wallpaper/${e.after.id ?? e.wallpaperSlug}/${createSlug(e.after.title ?? e.wallpaperSlug)}`}
                    className="edit-wallpaper"
                  >
                    {e.after.title ?? e.wallpaperSlug}
                    <ChevronRight size={14} />
                  </Link>
                  <span className="edit-when">{t ? t.toLocaleString() : ""}</span>
                </div>
                <div className="edit-by">
                  by <strong>{e.editedByName || e.editedByEmail || "Unknown"}</strong>
                </div>
                <ul className="edit-changes">
                  {Object.entries(e.changes).map(([field, diff]) => (
                    <li key={field}>
                      <code>{field}</code>:{" "}
                      <span className="from">{truncate(String(diff.from ?? "—"))}</span>{" "}
                      →{" "}
                      <span className="to">{truncate(String(diff.to ?? "—"))}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function truncate(s: string, max = 80): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
