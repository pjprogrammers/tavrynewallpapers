"use client";

/**
 * 📝 WallpaperEditModal
 * =======================
 *
 * Modal dialog for editing a wallpaper's metadata. Renders all the
 * fields that exist in the static `app/lib/wallpapers.ts` data:
 *
 *   - title
 *   - description
 *   - categoryId      (select)
 *   - tags            (multi-select chips)
 *   - resolution
 *   - featured        (toggle)
 *   - trending        (toggle)
 *   - uploadDate      (date picker)
 *
 * The modal writes the changes to `wallpapers/{slug}` via
 * `applyWallpaperEdit`, which also writes an immutable history
 * entry to `wallpaperEditHistory/{slug}/edits/{editId}`.
 *
 * Slug, id, and filename are intentionally NOT editable to avoid
 * breaking the URL / SEO / image references.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  Tag,
  History,
} from "lucide-react";

import {
  categories,
  tags as allTags,
} from "../lib/wallpapers";
import { useAuth } from "@/lib/auth-context";
import {
  applyWallpaperEdit,
  validateWallpaperEdit,
} from "@/lib/wallpaper-store";
import {
  getWallpaperEditHistory,
  type WallpaperEdit,
} from "@/lib/wallpaper-store";
import { revalidateWallpaperPaths } from "@/app/actions/revalidate";
import type {
  WallpaperMetadata,
  WallpaperEditPayload,
} from "@/lib/firestore-types";

interface WallpaperEditModalProps {
  slug: string;
  wallpaper: WallpaperMetadata;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
}

interface FormState {
  title: string;
  description: string;
  categoryId: string;
  tagsInput: string;
  tags: string[];
  resolution: string;
  featured: boolean;
  trending: boolean;
  uploadDate: string;
}

function toFormState(w: WallpaperMetadata): FormState {
  return {
    title: w.title ?? "",
    description: w.description ?? "",
    categoryId: w.categoryId ?? categories[0]?.id ?? "",
    tags: w.tags ? [...w.tags] : [],
    tagsInput: "",
    resolution: w.resolution ?? "3840x2160",
    featured: w.featured ?? false,
    trending: w.trending ?? false,
    uploadDate: w.uploadDate ?? new Date().toISOString().split("T")[0],
  };
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

  // Reset form whenever the modal opens with new wallpaper data
  useEffect(() => {
    if (isOpen) {
      setForm(toFormState(wallpaper));
      setError(null);
      setSuccess(null);
      // Focus first field after the dialog mounts
      setTimeout(() => firstFieldRef.current?.focus(), 50);
    }
  }, [isOpen, wallpaper]);

  // Close on Escape, lock body scroll
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

  // Load edit history
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
    if (!tag) return;
    if (tag.length > 32) return;
    setForm((f) =>
      f.tags.includes(tag) ? f : { ...f, tags: [...f.tags, tag] }
    );
  }, []);

  const removeTag = useCallback((tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) {
        setError("You must be signed in to edit a wallpaper.");
        return;
      }
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload: WallpaperEditPayload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        categoryId: form.categoryId,
        tags: form.tags,
        resolution: form.resolution.trim() || undefined,
        featured: form.featured,
        trending: form.trending,
        uploadDate: form.uploadDate,
      };

      try {
        validateWallpaperEdit(payload);
        const { changes } = await applyWallpaperEdit(slug, payload, {
          uid: user.uid,
          displayName: user.displayName || user.email || "Unknown",
          email: user.email || "",
        });
        const count = Object.keys(changes).length;
        setSuccess(
          count === 0
            ? "No changes detected."
            : `Saved ${count} field${count === 1 ? "" : "s"}.`
        );
        // Flush ISR caches for the affected pages so the change
        // propagates to listing pages and SEO indexes immediately.
        if (count > 0) {
          try {
            await revalidateWallpaperPaths(slug, {
              categoryId: !!changes.categoryId,
              tags: !!changes.tags,
              featured: !!changes.featured,
              trending: !!changes.trending,
            });
          } catch (e) {
            console.warn("revalidateWallpaperPaths failed (non-fatal):", e);
          }
        }
        // Refresh history view if open
        if (showHistory) {
          getWallpaperEditHistory(slug, 20).then(setHistory).catch(() => {});
        }
        // Notify parent (typically the Edit button)
        if (onSaved) await onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSaving(false);
      }
    },
    [user, form, slug, onSaved, showHistory]
  );

  // Compute recommended tags: union of current tags + static tag IDs
  const recommendedTags = useMemo(() => allTags.slice(0, 12), []);

  if (!isOpen) return null;

  return (
    <div
      className="edit-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
      >
        {/* Header */}
        <header className="edit-modal-header">
          <div>
            <h2 id="edit-modal-title" className="edit-modal-title">
              Edit Wallpaper
            </h2>
            <p className="edit-modal-subtitle">
              <code className="edit-modal-slug">wallpapers/{slug}</code>
            </p>
          </div>
          <button
            type="button"
            className="edit-modal-close"
            onClick={() => !saving && onClose()}
            aria-label="Close edit dialog"
            disabled={saving}
          >
            <X size={20} />
          </button>
        </header>

        {/* Alerts */}
        {error && (
          <div className="edit-modal-alert edit-modal-alert-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="edit-modal-alert edit-modal-alert-success" role="status">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-modal-form">
          {/* Slug / id (read-only) */}
          <div className="edit-form-row">
            <div className="edit-form-field">
              <label>ID (read-only)</label>
              <input type="text" value={wallpaper.id} readOnly className="edit-form-readonly" />
            </div>
            <div className="edit-form-field">
              <label>Slug (read-only)</label>
              <input type="text" value={slug} readOnly className="edit-form-readonly" />
            </div>
          </div>

          {/* Title */}
          <div className="edit-form-field">
            <label htmlFor="edit-title">Title <span className="edit-form-required">*</span></label>
            <input
              ref={firstFieldRef}
              id="edit-title"
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              maxLength={200}
              required
              placeholder="e.g. Futuristic Space Ship"
            />
            <div className="edit-form-hint">{form.title.length}/200</div>
          </div>

          {/* Description */}
          <div className="edit-form-field">
            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Optional, up to 2000 characters."
            />
            <div className="edit-form-hint">{form.description.length}/2000</div>
          </div>

          {/* Category */}
          <div className="edit-form-field">
            <label htmlFor="edit-category">Category <span className="edit-form-required">*</span></label>
            <select
              id="edit-category"
              value={form.categoryId}
              onChange={(e) => update("categoryId", e.target.value)}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags (multi-select chips) */}
          <div className="edit-form-field">
            <label htmlFor="edit-tags-input">
              <Tag size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
              Tags
            </label>
            <div className="edit-form-tags">
              {form.tags.map((tag) => (
                <span key={tag} className="edit-form-tag-chip">
                  {tag}
                  <button
                    type="button"
                    className="edit-form-tag-remove"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                id="edit-tags-input"
                type="text"
                value={form.tagsInput}
                onChange={(e) => update("tagsInput", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    if (form.tagsInput.trim()) {
                      addTag(form.tagsInput);
                      update("tagsInput", "");
                    }
                  } else if (e.key === "Backspace" && form.tagsInput === "" && form.tags.length > 0) {
                    removeTag(form.tags[form.tags.length - 1]);
                  }
                }}
                onBlur={() => {
                  if (form.tagsInput.trim()) {
                    addTag(form.tagsInput);
                    update("tagsInput", "");
                  }
                }}
                placeholder="Type a tag and press Enter…"
                className="edit-form-tags-input"
                maxLength={32}
              />
            </div>
            {recommendedTags.length > 0 && (
              <div className="edit-form-suggested">
                <span className="edit-form-suggested-label">Suggested:</span>
                {recommendedTags
                  .filter((t) => !form.tags.includes(t.id))
                  .slice(0, 8)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="edit-form-suggested-chip"
                      onClick={() => addTag(t.id)}
                    >
                      + {t.name}
                    </button>
                  ))}
              </div>
            )}
            <div className="edit-form-hint">Up to 30 tags, each ≤ 32 chars</div>
          </div>

          {/* Resolution + Upload date */}
          <div className="edit-form-row">
            <div className="edit-form-field">
              <label htmlFor="edit-resolution">Resolution</label>
              <input
                id="edit-resolution"
                type="text"
                value={form.resolution}
                onChange={(e) => update("resolution", e.target.value)}
                placeholder="3840x2160"
                pattern="\d{3,5}x\d{3,5}"
              />
              <div className="edit-form-hint">Format: WIDTHxHEIGHT (e.g. 3840x2160)</div>
            </div>
            <div className="edit-form-field">
              <label htmlFor="edit-uploadDate">Upload date</label>
              <input
                id="edit-uploadDate"
                type="date"
                value={form.uploadDate}
                onChange={(e) => update("uploadDate", e.target.value)}
              />
            </div>
          </div>

          {/* Featured + Trending toggles */}
          <div className="edit-form-row">
            <label className="edit-form-toggle">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => update("featured", e.target.checked)}
              />
              <span>Featured</span>
            </label>
            <label className="edit-form-toggle">
              <input
                type="checkbox"
                checked={form.trending}
                onChange={(e) => update("trending", e.target.checked)}
              />
              <span>Trending</span>
            </label>
          </div>

          {/* Locked info */}
          <div className="edit-form-locked">
            <Info size={14} />
            <span>
              <strong>Slug, id, and filename are locked</strong> to prevent broken
              URLs. Contact an admin if you need to change them.
            </span>
          </div>

          {/* History toggle */}
          <div className="edit-form-history-toggle">
            <button
              type="button"
              className="edit-form-history-button"
              onClick={() => setShowHistory((s) => !s)}
            >
              <History size={14} />
              {showHistory ? "Hide edit history" : "Show edit history"}
            </button>
          </div>

          {showHistory && (
            <div className="edit-form-history" aria-label="Edit history">
              {loadingHistory ? (
                <div className="edit-form-history-loading">
                  <Loader2 size={14} className="animate-spin" />
                  Loading history…
                </div>
              ) : history.length === 0 ? (
                <div className="edit-form-history-empty">No edits yet.</div>
              ) : (
                <ol className="edit-form-history-list">
                  {history.map((h) => (
                    <li key={h.id} className="edit-form-history-item">
                      <div className="edit-form-history-head">
                        <strong>{h.editedByName || h.editedByEmail}</strong>
                        <span>
                          {h.editedAt instanceof Date
                            ? h.editedAt.toLocaleString()
                            : (h.editedAt as { toDate?: () => Date })?.toDate?.()?.toLocaleString?.() ||
                              ""}
                        </span>
                      </div>
                      <ul className="edit-form-history-changes">
                        {Object.entries(h.changes).map(([field, diff]) => (
                          <li key={field}>
                            <code>{field}</code>:{" "}
                            <span className="edit-form-history-from">
                              {String(diff.from ?? "(empty)")}
                            </span>{" "}
                            →{" "}
                            <span className="edit-form-history-to">
                              {String(diff.to ?? "(empty)")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* Footer actions */}
          <footer className="edit-modal-footer">
            <button
              type="button"
              className="edit-modal-btn edit-modal-btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-modal-btn edit-modal-btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save changes
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
