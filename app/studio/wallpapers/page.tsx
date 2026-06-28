"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Search,
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  Download,
  Heart,
  ExternalLink,
  ImageIcon,
  CheckSquare,
  Square,
  Upload,
  X,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import {
  getAllWallpapersForStudio,
  searchWallpapers,
  softDeleteWallpaper,
  batchUpdateWallpapers,
} from "@/lib/wallpaper-store";

import type { WallpaperMetadata } from "@/lib/firestore-types";

import { createSlug } from "@/lib/slug";
import { resolveThumbnailUrl } from "@/lib/wallpaper-image";
import { fmtCompact } from "@/lib/format";

type SortKey = "updated" | "title" | "views" | "downloads";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updated", label: "Updated" },
  { key: "title", label: "Title" },
  { key: "views", label: "Views" },
  { key: "downloads", label: "Downloads" },
];

export default function WallpapersListing() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [wallpapers, setWallpapers] = useState<WallpaperMetadata[]>([]);
  const [allWallpapers, setAllWallpapers] = useState<WallpaperMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("updated");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const PAGE_SIZE = 50;

  const canCreate = user && hasPermission(user, "wallpaper.create", roles);
  const canDelete = user && hasPermission(user, "wallpaper.delete", roles);

  // Debounce search input before firing a DB query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadAll = useCallback(async (sort: SortKey) => {
    setLoading(true);
    const [field, dir] = sort === "updated" ? ["updatedAt", "desc" as const]
      : sort === "title" ? ["title", "asc" as const]
      : sort === "views" ? ["views", "desc" as const]
      : ["downloads", "desc" as const];
    const all = await getAllWallpapersForStudio(500, field, dir);
    setAllWallpapers(all);
    setWallpapers(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !rolesLoading && user && canCreate) loadAll(sortBy);
  }, [authLoading, rolesLoading, user, canCreate, loadAll, sortBy]);

  useEffect(() => {
    if (!debouncedSearch) {
      setWallpapers(allWallpapers);
      return;
    }
    searchWallpapers(debouncedSearch, allWallpapers).then((result) => {
      setWallpapers(result.wallpapers);
    });
  }, [debouncedSearch, allWallpapers]);

  const refetch = useCallback(() => {
    if (user) {
      user.getIdToken().then((token) => {
        fetch("/api/search/reset", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      }).catch(() => {});
    }
    loadAll(sortBy);
  }, [loadAll, sortBy, user]);

  const doBatch = useCallback(async (fields: Record<string, unknown>, label: string) => {
    if (!user || selected.size === 0) return;
    if (!window.confirm(`${label} ${selected.size} wallpaper${selected.size === 1 ? "" : "s"}?`)) return;
    setBatchBusy(true);
    try {
      await batchUpdateWallpapers(Array.from(selected), fields, {
        uid: user.uid,
        displayName: user.displayName || user.email || "Unknown",
        email: user.email || "",
      }, label);
      setSelected(new Set());
      refetch();
    } catch { /* ignore */ }
    setBatchBusy(false);
  }, [user, selected, refetch]);

  const handleDelete = useCallback(async (w: WallpaperMetadata) => {
    if (!window.confirm(`Soft-delete "${w.title}"? It can be restored later.`)) return;
    setDeleting(w.slug);
    try {
      await softDeleteWallpaper(w.slug, {
        uid: user?.uid ?? "",
        displayName: user?.displayName || user?.email || "Unknown",
        email: user?.email || "",
      });
      setWallpapers((prev) => prev.filter((p) => p.slug !== w.slug));
      setAllWallpapers((prev) => prev.filter((p) => p.slug !== w.slug));
    } catch { /* ignore */ }
    setDeleting(null);
  }, [user]);

  const toggle = useCallback((slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  }, []);

  const batchActions = useMemo(() => {
    if (selected.size === 0) return null;
    const btn = (label: string, fields: Record<string, unknown>, color: string) => (
      <button onClick={() => doBatch(fields, label)} disabled={batchBusy}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${color}`}>
        {label} ({selected.size})
      </button>
    );
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-xl mb-4 flex-wrap">
        <span className="text-xs text-zinc-400 mr-2">{selected.size} selected</span>
        {btn("Publish", { published: true }, "bg-emerald-600 hover:bg-emerald-500 text-white")}
        {btn("Unpublish", { published: false }, "bg-zinc-700 hover:bg-zinc-600 text-zinc-200")}
        {btn("Feature", { featured: true }, "bg-amber-600 hover:bg-amber-500 text-white")}
        {btn("Unfeature", { featured: false }, "bg-zinc-700 hover:bg-zinc-600 text-zinc-200")}
        {btn("Trending", { trending: true }, "bg-sky-600 hover:bg-sky-500 text-white")}
        {btn("Untrending", { trending: false }, "bg-zinc-700 hover:bg-zinc-600 text-zinc-200")}
        {canDelete && btn("Delete", { deleted: true }, "bg-red-700 hover:bg-red-600 text-white")}
        {canDelete && btn("Restore", { deleted: false }, "bg-blue-700 hover:bg-blue-600 text-white")}
        <button onClick={() => setSelected(new Set())} disabled={batchBusy}
          className="ml-auto p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400">
          <X size={14} />
        </button>
      </div>
    );
  }, [selected, batchBusy, doBatch, canDelete]);

  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-zinc-500">Access denied.</p>
        <Link href="/" className="text-amber-500 hover:text-amber-400 underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Wallpapers</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">{wallpapers.length} total</span>
          <Link href="/studio/wallpapers/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-all">
            <PlusCircle size={14} /> New
          </Link>
          <Link href="/studio/wallpapers/bulk-import"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs border border-zinc-700 rounded-lg hover:border-zinc-500 text-zinc-300 transition-all">
            <Upload size={14} /> Bulk Import
          </Link>
          <Link href="/studio/tools/recalculate"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs border border-zinc-700 rounded-lg hover:border-zinc-500 text-zinc-300 transition-all">
            <RefreshCw size={14} /> Recalculate
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 px-3.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg focus-within:border-amber-500/40">
          <Search size={14} className="text-zinc-500 shrink-0" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, ID, category, tag…"
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-zinc-600" />
        </div>
        <div className="flex gap-1 bg-zinc-900/60 rounded-lg p-1 border border-zinc-800">
          {SORT_OPTIONS.map((opt) => (
            <button key={opt.key} onClick={() => setSortBy(opt.key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${sortBy === opt.key ? "bg-amber-500/10 text-amber-400 font-medium" : "text-zinc-500 hover:text-zinc-300"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {batchActions}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-amber-500" /></div>
      ) : wallpapers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
          <ImageIcon size={28} className="opacity-40" />
          <p className="text-sm">{search ? "No wallpapers match your search." : "No wallpapers yet."}</p>
          {!search && (
            <Link href="/studio/wallpapers/new" className="text-amber-400 hover:text-amber-300 underline text-sm">
              Create your first wallpaper
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {wallpapers.slice(0, visibleCount).map((w) => {
            const isSelected = selected.has(w.slug);
            return (
              <div key={w.slug}
                className={`flex items-center gap-4 p-3 border rounded-xl transition-all group ${isSelected ? "bg-amber-500/5 border-amber-500/30" : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"}`}>
                <button onClick={() => toggle(w.slug)} className="shrink-0 p-1 text-zinc-500 hover:text-zinc-300">
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
                    <button onClick={() => handleDelete(w)} disabled={deleting === w.slug}
                      className="p-2 rounded-lg hover:bg-red-900/30 text-zinc-400 hover:text-red-400 transition-all disabled:opacity-50">
                      {deleting === w.slug ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {visibleCount < wallpapers.length && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-all"
              >
                Load More ({wallpapers.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
