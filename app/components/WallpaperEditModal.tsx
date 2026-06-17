"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  History,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  applyWallpaperEdit,
  validateWallpaperEdit,
  getWallpaperEditHistory,
  type WallpaperEdit,
} from "@/lib/wallpaper-store";
import { revalidateWallpaperPaths } from "@/app/actions/revalidate";
import type {
  WallpaperMetadata,
  WallpaperEditPayload,
} from "@/lib/firestore-types";
import EditWallpaperFormFields, {
  type FormState,
  toFormState,
} from "@/app/components/EditWallpaperFormFields";

interface WallpaperEditModalProps {
  slug: string;
  wallpaper: WallpaperMetadata;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
}

export default function WallpaperEditModal({
  slug,
  wallpaper,
  isOpen,
  onClose,
  onSaved,
}: WallpaperEditModalProps) {
  const { user } = useAuth();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormState>(() => toFormState(wallpaper));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<WallpaperEdit[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(toFormState(wallpaper));
      setError(null);
      setSuccess(null);
      setTimeout(() => firstFieldRef.current?.focus(), 50);
    }
  }, [isOpen, wallpaper]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, saving, onClose]);

  useEffect(() => {
    if (!isOpen || !showHistory) return;
    setLoadingHistory(true);
    getWallpaperEditHistory(slug, 20)
      .then((h) => setHistory(h))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoadingHistory(false));
  }, [isOpen, showHistory, slug]);

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const addTag = useCallback((raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || tag.length > 32) return;
    setForm((f) => (f.tags.includes(tag) ? f : { ...f, tags: [...f.tags, tag] }));
  }, []);

  const removeTag = useCallback((tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) { setError("You must be signed in."); return; }
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload: WallpaperEditPayload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        categoryId: form.categoryId,
        tags: form.tags,
        resolution: form.resolution.trim() || undefined,
        width: form.width.trim() ? parseInt(form.width.trim(), 10) || undefined : undefined,
        height: form.height.trim() ? parseInt(form.height.trim(), 10) || undefined : undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        storageProvider: form.storageProvider || undefined,
        featured: form.featured,
        trending: form.trending,
        visible: form.visible,
        published: form.published,
      };

      try {
        validateWallpaperEdit(payload);
        const { changes } = await applyWallpaperEdit(slug, payload, {
          uid: user.uid,
          displayName: user.displayName || user.email || "Unknown",
          email: user.email || "",
        });
        const count = Object.keys(changes).length;
        setSuccess(count === 0 ? "No changes detected." : `Saved ${count} field${count === 1 ? "" : "s"}.`);
        if (count > 0) {
          try { await revalidateWallpaperPaths(slug, { categoryId: !!changes.categoryId, tags: !!changes.tags, featured: !!changes.featured, trending: !!changes.trending }); }
          catch { /* non-fatal */ }
          if (showHistory) getWallpaperEditHistory(slug, 20).then(setHistory).catch(() => {});
        }
        if (onSaved) await onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSaving(false);
      }
    },
    [user, form, slug, onSaved, showHistory]
  );

  if (!isOpen) return null;

  return (
    <div className="edit-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }} role="presentation">
      <div ref={dialogRef} className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
        <header className="edit-modal-header">
          <div>
            <h2 id="edit-modal-title" className="edit-modal-title">Edit Wallpaper</h2>
            <p className="edit-modal-subtitle"><code className="edit-modal-slug">wallpapers/{slug}</code></p>
          </div>
          <button type="button" className="edit-modal-close" onClick={() => !saving && onClose()} aria-label="Close" disabled={saving}>
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="edit-modal-form">
          <EditWallpaperFormFields
            form={form}
            update={update}
            addTag={addTag}
            removeTag={removeTag}
            saving={saving}
            error={error}
            success={success}
            wallpaper={wallpaper}
          />

          <div className="edit-form-locked">
            <Info size={14} />
            <span><strong>Slug, id, and filename are locked</strong> to prevent broken URLs.</span>
          </div>

          <div className="edit-form-history-toggle">
            <button type="button" className="edit-form-history-button" onClick={() => setShowHistory((s) => !s)}>
              <History size={14} />
              {showHistory ? "Hide edit history" : "Show edit history"}
            </button>
          </div>

          {showHistory && (
            <div className="edit-form-history" aria-label="Edit history">
              {loadingHistory ? (
                <div className="edit-form-history-loading"><Loader2 size={14} className="animate-spin" /> Loading history…</div>
              ) : history.length === 0 ? (
                <div className="edit-form-history-empty">No edits yet.</div>
              ) : (
                <ol className="edit-form-history-list">
                  {history.map((h) => (
                    <li key={h.id} className="edit-form-history-item">
                      <div className="edit-form-history-head">
                        <strong>{h.editedByName || h.editedByEmail}</strong>
                        <span>{h.editedAt instanceof Date ? h.editedAt.toLocaleString() : (h.editedAt as { toDate?: () => Date })?.toDate?.()?.toLocaleString?.() || ""}</span>
                      </div>
                      <ul className="edit-form-history-changes">
                        {Object.entries(h.changes).map(([field, diff]) => (
                          <li key={field}><code>{field}</code>: <span className="edit-form-history-from">{String(diff.from ?? "(empty)")}</span> → <span className="edit-form-history-to">{String(diff.to ?? "(empty)")}</span></li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          <footer className="edit-modal-footer">
            <button type="button" className="edit-modal-btn edit-modal-btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="edit-modal-btn edit-modal-btn-primary" disabled={saving}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save changes</>}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
