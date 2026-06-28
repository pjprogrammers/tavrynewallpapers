"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2, Plus, Trash2, Layers, Tag, AlertCircle, X, Search,
  ImageIcon, Download, Heart, Eye, ExternalLink,
  CheckSquare, Square, Upload, Edit3,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import {
  getAllWallpapersForStudio,
  softDeleteWallpaper,
  batchUpdateWallpapers,
} from "@/lib/wallpaper-store";
import { resolveThumbnailUrl } from "@/lib/wallpaper-image";
import type { WallpaperMetadata } from "@/lib/firestore-types";
import { createSlug } from "@/lib/slug";
import { fmtCompact } from "@/lib/format";

type SortKey = "updated" | "title" | "views" | "downloads";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updated", label: "Updated" },
  { key: "title", label: "Title" },
  { key: "views", label: "Views" },
  { key: "downloads", label: "Downloads" },
];

export default function StudioPage() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();

  const [wallpapers, setWallpapers] = useState<WallpaperMetadata[]>([]);
  const [wallpaperLoading, setWallpaperLoading] = useState(true);

  const [wallpaperSearch, setWallpaperSearch] = useState("");
  const [wallpaperSortBy, setWallpaperSortBy] = useState<SortKey>("updated");
  const [wallpaperDeleting, setWallpaperDeleting] = useState<string | null>(null);
  const [wallpaperSelected, setWallpaperSelected] = useState<Set<string>>(new Set());
  const [wallpaperBatchBusy, setWallpaperBatchBusy] = useState(false);

  const canEdit = user && hasPermission(user, "wallpaper.edit", roles);
  const canDelete = user && hasPermission(user, "wallpaper.delete", roles);

  const loadAll = useCallback(async () => {
    if (!canEdit) return;
    setWallpaperLoading(true);
    try {
      const wallpapersData = await getAllWallpapersForStudio(2000, "updatedAt", "desc");
      setWallpapers(wallpapersData);
    } catch (err) {
      console.error("[Studio] Failed to load wallpapers:", err);
    } finally {
      setWallpaperLoading(false);
    }
  }, [canEdit]);

  useEffect(() => {
    if (!authLoading && !rolesLoading && canEdit) loadAll();
  }, [authLoading, rolesLoading, canEdit, loadAll]);

  // Wallpapers functions
  const fetchWallpapers = useCallback(async (sort: SortKey) => {
    setWallpaperLoading(true);
    const [field, dir] = sort === "updated" ? ["updatedAt", "desc" as const]
      : sort === "title" ? ["title", "asc" as const]
      : sort === "views" ? ["views", "desc" as const]
      : ["downloads", "desc" as const];
    const all = await getAllWallpapersForStudio(2000, field, dir);
    setWallpapers(all);
    setWallpaperLoading(false);
  }, []);

  const handleWallpaperBatch = useCallback(async (fields: Record<string, unknown>, label: string) => {
    if (!user || wallpaperSelected.size === 0) return;
    if (!window.confirm(`${label} ${wallpaperSelected.size} wallpaper${wallpaperSelected.size === 1 ? "" : "s"}?`)) return;
    setWallpaperBatchBusy(true);
    try {
      await batchUpdateWallpapers(Array.from(wallpaperSelected), fields, {
        uid: user.uid,
        displayName: user.displayName || user.email || "Unknown",
        email: user.email || "",
      }, label);
      setWallpaperSelected(new Set());
      await loadAll();
    } catch { /* ignore */ }
    setWallpaperBatchBusy(false);
  }, [user, wallpaperSelected, loadAll]);

  const handleWallpaperDelete = useCallback(async (w: WallpaperMetadata) => {
    if (!window.confirm(`Soft-delete "${w.title}"? It can be restored later.`)) return;
    setWallpaperDeleting(w.slug);
    try {
      await softDeleteWallpaper(w.slug, {
        uid: user?.uid ?? "",
        displayName: user?.displayName || user?.email || "Unknown",
        email: user?.email || "",
      });
      setWallpapers((prev) => prev.filter((p) => p.slug !== w.slug));
    } catch { /* ignore */ }
    setWallpaperDeleting(null);
  }, [user]);

  const wallpaperBatchActions = useMemo(() => {
    if (wallpaperSelected.size === 0) return null;
    const btn = (label: string, fields: Record<string, unknown>, color: string) => (
      <button onClick={() => handleWallpaperBatch(fields, label)} disabled={wallpaperBatchBusy}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${color}`}>
        {label} ({wallpaperSelected.size})
      </button>
    );
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-xl mb-4 flex-wrap">
        <span className="text-xs text-zinc-400 mr-2">{wallpaperSelected.size} selected</span>
        {btn("Publish", { published: true }, "bg-emerald-600 hover:bg-emerald-500 text-white")}
        {btn("Unpublish", { published: false }, "bg-zinc-700 hover:bg-zinc-600 text-zinc-200")}
        {btn("Feature", { featured: true }, "bg-amber-600 hover:bg-amber-500 text-white")}
        {btn("Unfeature", { featured: false }, "bg-zinc-700 hover:bg-zinc-600 text-zinc-200")}
        {canDelete && btn("Delete", { deleted: true }, "bg-red-700 hover:bg-red-600 text-white")}
        {canDelete && btn("Restore", { deleted: false }, "bg-blue-700 hover:bg-blue-600 text-white")}
        <button onClick={() => setWallpaperSelected(new Set())} disabled={wallpaperBatchBusy}
          className="ml-auto p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400">
          <X size={14} />
        </button>
      </div>
    );
  }, [wallpaperSelected, wallpaperBatchBusy, handleWallpaperBatch, canDelete]);

  const wallpaperFiltered = useMemo(() => {
    if (!wallpaperSearch) return wallpapers;
    const s = wallpaperSearch.toLowerCase();
    return wallpapers.filter(
      (w) =>
        w.title.toLowerCase().includes(s) ||
        w.id.toLowerCase().includes(s) ||
        w.categoryId.toLowerCase().includes(s) ||
        (w.tags ?? []).some((t) => t.toLowerCase().includes(s))
    );
  }, [wallpapers, wallpaperSearch]);



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
        <AlertCircle size={48} className="text-red-400" />
        <h2 className="text-xl font-semibold text-zinc-300">Access Denied</h2>
        <Link href="/" className="text-amber-500 hover:text-amber-400 underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Layers size={24} className="text-amber-500" />
          <h1 className="text-2xl font-bold text-zinc-100">Studio CMS</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/studio/categories"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs border border-zinc-700 rounded-lg hover:border-zinc-500 text-zinc-300 transition-all">
            Categories
          </Link>
          <Link href="/studio/tags"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs border border-zinc-700 rounded-lg hover:border-zinc-500 text-zinc-300 transition-all">
            Tags
          </Link>
          <Link href="/studio/wallpapers/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-all">
            <Plus size={14} /> New Wallpaper
          </Link>
          <Link href="/studio/wallpapers/bulk-import"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs border border-zinc-700 rounded-lg hover:border-zinc-500 text-zinc-300 transition-all">
            <Upload size={14} /> Bulk Import
          </Link>
        </div>
      </div>



      <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-zinc-100">Wallpapers</h2>
            <span className="text-sm text-zinc-500">{wallpaperFiltered.length} total</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1 px-3.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg focus-within:border-amber-500/40">
              <Search size={14} className="text-zinc-500 shrink-0" />
              <input type="search" value={wallpaperSearch} onChange={(e) => setWallpaperSearch(e.target.value)}
                placeholder="Search by title, ID, category, tag…"
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-zinc-600" />
            </div>
            <div className="flex gap-1 bg-zinc-900/60 rounded-lg p-1 border border-zinc-800">
              {SORT_OPTIONS.map((opt) => (
                <button key={opt.key} onClick={() => setWallpaperSortBy(opt.key)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${wallpaperSortBy === opt.key ? "bg-amber-500/10 text-amber-400 font-medium" : "text-zinc-500 hover:text-zinc-300"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {wallpaperBatchActions}

          {wallpaperLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-amber-500" /></div>
          ) : wallpaperFiltered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
              <ImageIcon size={28} className="opacity-40" />
              <p className="text-sm">{wallpaperSearch ? "No wallpapers match your search." : "No wallpapers yet."}</p>
              {!wallpaperSearch && (
                <Link href="/studio/wallpapers/new" className="text-amber-400 hover:text-amber-300 underline text-sm">
                  Create your first wallpaper
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {wallpaperFiltered.map((w) => {
                const isSelected = wallpaperSelected.has(w.slug);
                return (
                  <div key={w.slug}
                    className={`flex items-center gap-4 p-3 border rounded-xl transition-all group ${isSelected ? "bg-amber-500/5 border-amber-500/30" : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"}`}>
                    <button onClick={() => setWallpaperSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(w.slug)) next.delete(w.slug); else next.add(w.slug);
                      return next;
                    })}
                      className="shrink-0 p-1 text-zinc-500 hover:text-zinc-300">
                      {isSelected ? <CheckSquare size={16} className="text-amber-400" /> : <Square size={16} />}
                    </button>
                    <div className="h-14 w-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0 ring-1 ring-zinc-700 relative">
                      <Image src={resolveThumbnailUrl(w) ?? `/wallpapers/${w.filename}`} alt={w.title} fill className="object-cover" unoptimized />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/wallpaper/${w.id}/${createSlug(w.title)}`} target="_blank" rel="noopener"
                          className="text-sm font-medium text-zinc-200 truncate hover:text-amber-400 transition-colors">
                          {w.title}
                        </Link>
                        <span className="text-[10px] text-zinc-600 font-mono">#{w.id}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] text-zinc-500 capitalize bg-zinc-800 px-1.5 py-0.5 rounded">{w.categoryId}</span>
                        {!w.published && <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Draft</span>}
                        {!w.visible && <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">Hidden</span>}
                        {w.featured && <span className="text-[10px] text-amber-600 bg-amber-500/20 px-1.5 py-0.5 rounded">Featured</span>}
                        {w.trending && <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Trending</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-500">
                        <span className="flex items-center gap-0.5"><Eye size={9} />{fmtCompact(w.views ?? 0)}</span>
                        <span className="flex items-center gap-0.5"><Download size={9} />{fmtCompact(w.downloads ?? 0)}</span>
                        <span className="flex items-center gap-0.5"><Heart size={9} />{fmtCompact(w.favorites ?? 0)}</span>
                        {w.width && w.height && <span>{w.width}&times;{w.height}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link href={`/studio/wallpapers/edit/${w.id}`}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all">
                        <Edit3 size={14} />
                      </Link>
                      <Link href={`/wallpaper/${w.id}/${createSlug(w.title)}`} target="_blank" rel="noopener"
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all">
                        <ExternalLink size={14} />
                      </Link>
                      {canDelete && (
                        <button onClick={() => {
                          const wCopy = {...w};
                          handleWallpaperDelete(wCopy);
                        }} disabled={wallpaperDeleting === w.slug}
                          className="p-2 rounded-lg hover:bg-red-900/30 text-zinc-400 hover:text-red-400 transition-all disabled:opacity-50">
                          {wallpaperDeleting === w.slug ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}