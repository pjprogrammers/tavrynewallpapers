"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Sparkles,
  Star,
  ExternalLink,
  Edit3,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import { getAllWallpapersFromFirestore, applyWallpaperEdit } from "@/lib/wallpaper-store";
import type { WallpaperMetadata } from "@/lib/firestore-types";
import { createSlug } from "@/lib/slug";
import { resolveThumbnailUrl } from "@/lib/wallpaper-image";
import { revalidateWallpaperPaths } from "@/app/actions/revalidate";

export default function FeaturedManagerPage() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [wallpapers, setWallpapers] = useState<WallpaperMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const canEdit = user && hasPermission(user, "wallpaper.edit", roles);
  const canCreate = user && hasPermission(user, "wallpaper.create", roles);

  const fetch = useCallback(async () => {
    setLoading(true);
    const all = await getAllWallpapersFromFirestore(500);
    setWallpapers(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !rolesLoading && canEdit) fetch();
  }, [authLoading, rolesLoading, canEdit, fetch]);

  const handleToggle = useCallback(async (w: WallpaperMetadata, featured: boolean) => {
    if (!user) return;
    setToggling(w.slug);
    try {
      await applyWallpaperEdit(w.slug, { featured }, {
        uid: user.uid,
        displayName: user.displayName || user.email || "Unknown",
        email: user.email || "",
      });
      await revalidateWallpaperPaths(w.slug, { featured: true }).catch(() => {});
      setWallpapers((prev) => prev.map((p) => (p.slug === w.slug ? { ...p, featured } : p)));
    } catch { /* ignore */ }
    setToggling(null);
  }, [user]);

  const featured = wallpapers.filter((w) => w.featured && !w.deleted);
  const notFeatured = wallpapers.filter((w) => !w.featured && !w.deleted);

  const filteredNotFeatured = search
    ? notFeatured.filter((w) => w.title.toLowerCase().includes(search.toLowerCase()))
    : notFeatured;

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
      <div className="flex items-center gap-3 mb-8">
        <Sparkles size={24} className="text-amber-400" />
        <h1 className="text-2xl font-bold text-zinc-100">Featured Wallpapers</h1>
        <span className="text-xs text-zinc-500">{featured.length} featured</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-amber-500" /></div>
      ) : (
        <div className="space-y-8">
          {/* Currently featured */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <Star size={14} className="text-amber-400" /> Currently Featured
            </h2>
            {featured.length === 0 ? (
              <p className="text-sm text-zinc-500">No wallpapers are currently featured.</p>
            ) : (
              <div className="space-y-2">
                {featured.map((w) => (
                  <div key={w.slug}
                    className="flex items-center gap-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <div className="h-12 w-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0 ring-1 ring-zinc-700">
                      <img src={resolveThumbnailUrl(w) ?? `/wallpapers/${w.filename}`} alt={w.title}
                        className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-200 truncate">{w.title}</p>
                      <p className="text-xs text-zinc-500">{w.width}&times;{w.height} &middot; {w.categoryId}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleToggle(w, false)} disabled={toggling === w.slug}
                        className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all">
                        {toggling === w.slug ? <Loader2 size={12} className="animate-spin" /> : "Remove"}
                      </button>
                      <Link href={`/studio/wallpapers/edit/${w.id}`}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all">
                        <Edit3 size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add to featured */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">Add to Featured</h2>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wallpapers…"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 mb-3" />
            {filteredNotFeatured.length === 0 ? (
              <p className="text-sm text-zinc-500">No wallpapers found.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredNotFeatured.slice(0, 50).map((w) => (
                  <div key={w.slug}
                    className="flex items-center gap-4 p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all">
                    <div className="h-12 w-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0 ring-1 ring-zinc-700">
                      <img src={resolveThumbnailUrl(w) ?? `/wallpapers/${w.filename}`} alt={w.title}
                        className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-200 truncate">{w.title}</p>
                      <p className="text-xs text-zinc-500">{w.categoryId}</p>
                    </div>
                    <button onClick={() => handleToggle(w, true)} disabled={toggling === w.slug}
                      className="px-3 py-1.5 text-xs rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 text-white transition-all flex items-center gap-1 shrink-0">
                      {toggling === w.slug ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
                      Feature
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
