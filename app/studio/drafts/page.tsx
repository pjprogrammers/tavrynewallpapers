"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  EyeOff,
  ExternalLink,
  Edit3,
  ImageIcon,
  Upload,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import {
  getUnpublishedFromFirestore,
  applyWallpaperEdit,
  batchUpdateWallpapers,
} from "@/lib/wallpaper-store";
import type { WallpaperMetadata } from "@/lib/firestore-types";
import { createSlug } from "@/lib/slug";
import { resolveThumbnailUrl } from "@/lib/wallpaper-image";
import { revalidateWallpaperPaths } from "@/app/actions/revalidate";

export default function DraftsPage() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [drafts, setDrafts] = useState<WallpaperMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishingAll, setPublishingAll] = useState(false);

  const canEdit = user && hasPermission(user, "wallpaper.edit", roles);

  const fetch = useCallback(async () => {
    setLoading(true);
    const all = await getUnpublishedFromFirestore(200);
    setDrafts(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !rolesLoading && canEdit) fetch();
  }, [authLoading, rolesLoading, canEdit, fetch]);

  const handlePublish = useCallback(async (w: WallpaperMetadata) => {
    if (!user) return;
    setPublishing(w.slug);
    try {
      await applyWallpaperEdit(w.slug, { published: true }, {
        uid: user.uid,
        displayName: user.displayName || user.email || "Unknown",
        email: user.email || "",
      });
      await revalidateWallpaperPaths(w.slug, {}).catch(() => {});
      setDrafts((prev) => prev.filter((d) => d.slug !== w.slug));
    } catch { /* ignore */ }
    setPublishing(null);
  }, [user]);

  const handlePublishAll = useCallback(async () => {
    if (!user || drafts.length === 0) return;
    if (!window.confirm(`Publish all ${drafts.length} drafts?`)) return;
    setPublishingAll(true);
    try {
      await batchUpdateWallpapers(drafts.map((d) => d.slug), { published: true }, {
        uid: user.uid,
        displayName: user.displayName || user.email || "Unknown",
        email: user.email || "",
      }, "batch-publish");
      fetch();
    } catch { /* ignore */ }
    setPublishingAll(false);
  }, [user, drafts, fetch]);

  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-zinc-500">Access denied.</p>
        <Link href="/" className="text-amber-500 hover:text-amber-400 underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <EyeOff size={24} className="text-amber-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Draft Review Queue</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">{drafts.length} drafts</span>
          {drafts.length > 1 && (
            <button onClick={handlePublishAll} disabled={publishingAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-medium rounded-lg transition-all">
              {publishingAll ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Publish All
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-amber-500" /></div>
      ) : drafts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
          <CheckCircle2 size={28} className="opacity-40" />
          <p className="text-sm">No drafts. Every wallpaper is published.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((w) => (
            <div key={w.slug}
              className="flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-amber-500/30 transition-all">
              <div className="h-16 w-24 rounded-lg overflow-hidden bg-zinc-800 shrink-0 ring-1 ring-zinc-700">
                <img src={resolveThumbnailUrl(w) ?? `/wallpapers/${w.filename}`} alt={w.title}
                  className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-200 truncate">{w.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5 capitalize">{w.categoryId} &middot; {w.tags?.length ?? 0} tags</p>
                <p className="text-xs text-zinc-600 mt-1">
                  {w.createdBy ? <span>Created by <span className="text-zinc-400">{w.createdBy}</span></span> : null}
                  {w.createdAt instanceof Date ? <span> &middot; {w.createdAt.toLocaleDateString()}</span> : null}
                </p>
                {w.description && <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">{w.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/studio/wallpapers/edit/${w.id}`}
                  className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all flex items-center gap-1">
                  <Edit3 size={12} /> Edit
                </Link>
                <button onClick={() => handlePublish(w)} disabled={publishing === w.slug}
                  className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white transition-all flex items-center gap-1">
                  {publishing === w.slug ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                  Publish
                </button>
                <Link href={`/wallpaper/${w.id}/${createSlug(w.title)}`} target="_blank" rel="noopener"
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all">
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
