"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  RotateCcw,
  Trash2,
  ExternalLink,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import {
  getDeletedWallpapersFromFirestore,
  restoreWallpaper,
  deleteWallpaperBySlug,
} from "@/lib/wallpaper-store";
import type { WallpaperMetadata } from "@/lib/firestore-types";
import { createSlug } from "@/lib/slug";
import { resolveThumbnailUrl } from "@/lib/wallpaper-image";

export default function DeletedPage() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [deleted, setDeleted] = useState<WallpaperMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const canDelete = user && hasPermission(user, "wallpaper.delete", roles);

  const fetch = useCallback(async () => {
    setLoading(true);
    const all = await getDeletedWallpapersFromFirestore(200);
    setDeleted(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !rolesLoading && canDelete) fetch();
  }, [authLoading, rolesLoading, canDelete, fetch]);

  const handleRestore = useCallback(async (slug: string) => {
    setProcessing(slug);
    try {
      await restoreWallpaper(slug, {
        uid: user?.uid ?? "",
        displayName: user?.displayName || user?.email || "Unknown",
        email: user?.email || "",
      });
      setDeleted((prev) => prev.filter((d) => d.slug !== slug));
    } catch { /* ignore */ }
    setProcessing(null);
  }, [user]);

  const handlePermanentDelete = useCallback(async (w: WallpaperMetadata) => {
    if (!window.confirm(`Permanently delete "${w.title}"? This cannot be undone.`)) return;
    setProcessing(w.slug);
    try {
      await deleteWallpaperBySlug(w.slug);
      setDeleted((prev) => prev.filter((d) => d.slug !== w.slug));
    } catch { /* ignore */ }
    setProcessing(null);
  }, []);

  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!canDelete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle size={48} className="text-red-400" />
        <h2 className="text-xl font-semibold text-zinc-300">Access Denied</h2>
        <p className="text-zinc-500">Admin access required.</p>
        <Link href="/" className="text-amber-500 hover:text-amber-400 underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Trash2 size={24} className="text-red-400" />
        <h1 className="text-2xl font-bold text-zinc-100">Deleted Wallpapers</h1>
        <span className="text-xs text-zinc-500">{deleted.length} deleted</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-amber-500" /></div>
      ) : deleted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
          <RotateCcw size={28} className="opacity-40" />
          <p className="text-sm">No deleted wallpapers. The trash is empty.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deleted.map((w) => (
            <div key={w.slug}
              className="flex items-center gap-4 p-3 bg-zinc-900/40 border border-red-900/30 rounded-xl hover:border-red-800/50 transition-all">
              <div className="h-14 w-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0 ring-1 ring-zinc-700 opacity-50 relative">
                <Image src={resolveThumbnailUrl(w) ?? `/wallpapers/${w.filename}`} alt={w.title} fill className="object-cover" unoptimized />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-400 truncate line-through">{w.title}</p>
                <p className="text-xs text-zinc-600">#{w.id} &middot; {w.categoryId} &middot; {w.tags?.length ?? 0} tags</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleRestore(w.slug)} disabled={processing === w.slug}
                  className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white transition-all flex items-center gap-1">
                  {processing === w.slug ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                  Restore
                </button>
                <button onClick={() => handlePermanentDelete(w)} disabled={processing === w.slug}
                  className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 text-white transition-all flex items-center gap-1">
                  {processing === w.slug ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
