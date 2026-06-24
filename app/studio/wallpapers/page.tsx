"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Heart,
  ExternalLink,
  ImageIcon,
  CheckSquare,
  Square,
  Upload,
  X,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
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
import { formatAspectRatio, deriveOrientation } from "@/lib/wallpaper-utils";
import { withResolutionTag } from "@/lib/resolution-tiers";
import type { WallpaperMetadata } from "@/lib/firestore-types";
import { COLLECTIONS } from "@/lib/firestore-types";
import { getDB } from "@/lib/firebase";
import { doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { createSlug } from "@/lib/slug";
import { resolveThumbnailUrl } from "@/lib/wallpaper-image";

function detectDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to load"));
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

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

  // Recalculate panel state
  const [recalcOpen, setRecalcOpen] = useState(false);
  const [recalcFromId, setRecalcFromId] = useState("");
  const [recalcToId, setRecalcToId] = useState("");
  const [recalcSpecificIds, setRecalcSpecificIds] = useState("");
  const [recalcProcessing, setRecalcProcessing] = useState(false);
  const [recalcResults, setRecalcResults] = useState<{ slug: string; id: string; title: string; fixed: string[] }[] | null>(null);
  const [recalcError, setRecalcError] = useState<string | null>(null);
  const [recalcProgress, setRecalcProgress] = useState<{ current: number; total: number } | null>(null);
  const [recalcDetectDims, setRecalcDetectDims] = useState(false);

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
    const all = await getAllWallpapersForStudio(10000, field, dir);
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

  const handleRecalculate = useCallback(async () => {
    if (!user) return;
    setRecalcProcessing(true);
    setRecalcError(null);
    setRecalcResults(null);

    try {
      const all = await getAllWallpapersForStudio(1000);
      let filtered = all.filter((w) => !w.deleted);

      const parsed = recalcSpecificIds.trim()
        ? recalcSpecificIds.split(",").map((s) => s.trim()).filter(Boolean).map(Number).filter((n) => !isNaN(n) && n > 0)
        : [];

      if (parsed.length > 0) {
        const idSet = new Set(parsed.map(String));
        filtered = filtered.filter((w) => idSet.has(w.id));
      } else {
        const start = recalcFromId ? parseInt(recalcFromId, 10) : NaN;
        const end = recalcToId ? parseInt(recalcToId, 10) : NaN;
        if (isNaN(start) && isNaN(end)) {
          setRecalcError("Enter an ID range (From\u2013To) or a list of specific IDs");
          setRecalcProcessing(false);
          return;
        }
        filtered = filtered.filter((w) => {
          const nid = parseInt(w.id, 10);
          if (isNaN(nid)) return false;
          if (!isNaN(start) && nid < start) return false;
          if (!isNaN(end) && nid > end) return false;
          return true;
        });
      }

      if (filtered.length === 0) {
        setRecalcError("No wallpapers found matching the specified IDs");
        setRecalcProcessing(false);
        return;
      }

      setRecalcProgress({ current: 0, total: filtered.length });

      const fixes: { slug: string; id: string; title: string; fixed: string[] }[] = [];
      const DIM_CONCURRENCY = 5;
      const BATCH_SIZE = 50;
      const db = getDB();

      let dimResults: Map<string, { width: number; height: number } | null> = new Map();

      if (recalcDetectDims) {
        const withUrl = filtered.filter((w) => w.imageUrl);
        for (let i = 0; i < withUrl.length; i += DIM_CONCURRENCY) {
          const batch = withUrl.slice(i, i + DIM_CONCURRENCY);
          await Promise.all(
            batch.map(async (w) => {
              setRecalcProgress({ current: i + 1 + batch.indexOf(w), total: filtered.length });
              try {
                const dims = await detectDimensions(w.imageUrl!);
                dimResults.set(w.slug, dims);
              } catch {
                dimResults.set(w.slug, null);
              }
            })
          );
        }
      }

      for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
        const chunk = filtered.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        let batchHasWrites = false;

        for (const w of chunk) {
          const update: Record<string, unknown> = {};
          const fixed: string[] = [];

          let width = w.width;
          let height = w.height;

          if (recalcDetectDims) {
            const dim = dimResults.get(w.slug);
            if (dim && dim.width > 0 && dim.height > 0) {
              width = dim.width;
              height = dim.height;
              if (dim.width !== w.width || dim.height !== w.height) {
                update.width = dim.width;
                update.height = dim.height;
                update.resolution = `${dim.width}x${dim.height}`;
                fixed.push("dimensions");
              }
            }
          }

          if (width && height && width > 0 && height > 0) {
            const ratio = formatAspectRatio(width, height);
            if (ratio && w.aspectRatio !== ratio) {
              update.aspectRatio = ratio;
              fixed.push("aspectRatio");
            }

            const orientation = deriveOrientation(width, height);
            if (w.orientation !== orientation) {
              update.orientation = orientation;
              fixed.push("orientation");
            }

            const updatedTags = withResolutionTag(w.tags ?? [], width, height);
            const oldTags = w.tags ?? [];
            if (
              updatedTags.length !== oldTags.length ||
              updatedTags.some((t, j) => t !== oldTags[j])
            ) {
              update.tags = updatedTags;
              fixed.push("resolutionTag");
            }
          }

          if (fixed.length > 0) {
            const ref = doc(db, COLLECTIONS.WALLPAPERS, w.slug);
            batch.update(ref, {
              ...update,
              updatedAt: serverTimestamp(),
              updatedBy: user.uid,
            });
            batchHasWrites = true;
            fixes.push({ slug: w.slug, id: w.id, title: w.title, fixed });
          }
        }

        if (batchHasWrites) {
          await batch.commit();
        }

        setRecalcProgress({ current: Math.min(i + BATCH_SIZE, filtered.length), total: filtered.length });
      }

      setRecalcResults(fixes);
      refetch();
    } catch (e) {
      setRecalcError(e instanceof Error ? e.message : String(e));
    } finally {
      setRecalcProcessing(false);
      setRecalcProgress(null);
    }
  }, [user, recalcFromId, recalcToId, recalcSpecificIds, recalcDetectDims, refetch]);

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
        </div>
      </div>

      {/* Recalculate Panel */}
      <div className="mb-4">
        <button
          onClick={() => setRecalcOpen((v) => !v)}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-2"
        >
          {recalcOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <RefreshCw size={13} />
          Recalculate metadata for ID range
        </button>

        {recalcOpen && (
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-1">From ID</label>
                <input
                  type="number" min={1}
                  value={recalcFromId}
                  onChange={(e) => setRecalcFromId(e.target.value)}
                  placeholder="e.g. 1"
                  disabled={recalcProcessing}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm"
                />
              </div>
              <span className="text-zinc-600 mt-5">&ndash;</span>
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-1">To ID</label>
                <input
                  type="number" min={1}
                  value={recalcToId}
                  onChange={(e) => setRecalcToId(e.target.value)}
                  placeholder="e.g. 100"
                  disabled={recalcProcessing}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-zinc-900/60 px-2 text-zinc-600">or</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Specific IDs (comma-separated)</label>
              <textarea
                value={recalcSpecificIds}
                onChange={(e) => setRecalcSpecificIds(e.target.value)}
                placeholder="1, 5, 12, 45, 100"
                rows={2}
                disabled={recalcProcessing}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm resize-none"
              />
            </div>

            {recalcError && (
              <div className="flex items-start gap-2 text-xs text-red-400">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                <span>{recalcError}</span>
              </div>
            )}

            {recalcResults && (
              <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                <p className="text-xs text-emerald-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  Updated {recalcResults.length} wallpaper{recalcResults.length === 1 ? "" : "s"}
                </p>
                <div className="max-h-32 overflow-y-auto space-y-0.5">
                  {recalcResults.slice(0, 20).map((r) => (
                    <p key={r.slug} className="text-[11px] text-zinc-500">
                      <Link href={`/studio/wallpapers/edit/${r.id}`} className="text-zinc-300 hover:text-amber-400">
                        {r.title}
                      </Link>
                      <span className="text-zinc-600"> &mdash; </span>
                      {r.fixed.join(", ")}
                    </p>
                  ))}
                  {recalcResults.length > 20 && (
                    <p className="text-[11px] text-zinc-600">+{recalcResults.length - 20} more</p>
                  )}
                </div>
              </div>
            )}

            {recalcProgress && (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Loader2 size={12} className="animate-spin text-amber-400" />
                <span>Processing {recalcProgress.current} of {recalcProgress.total}</span>
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={recalcDetectDims}
                onChange={(e) => setRecalcDetectDims(e.target.checked)}
                disabled={recalcProcessing}
                className="rounded bg-zinc-800 border-zinc-600 text-amber-500 focus:ring-amber-500/50"
              />
              <span>
                Detect image dimensions{" "}
                <span className="text-zinc-600">(loads each image &mdash; slower for large ranges)</span>
              </span>
            </label>

            <button
              onClick={handleRecalculate}
              disabled={recalcProcessing || (!recalcFromId && !recalcToId && !recalcSpecificIds.trim())}
              className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              {recalcProcessing ? (
                <><Loader2 size={14} className="animate-spin" /> Processing&hellip;</>
              ) : (
                <><RefreshCw size={14} /> Recalculate</>
              )}
            </button>
          </div>
        )}
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
          {wallpapers.map((w) => {
            const isSelected = selected.has(w.slug);
            return (
              <div key={w.slug}
                className={`flex items-center gap-4 p-3 border rounded-xl transition-all group ${isSelected ? "bg-amber-500/5 border-amber-500/30" : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"}`}>
                <button onClick={() => toggle(w.slug)} className="shrink-0 p-1 text-zinc-500 hover:text-zinc-300">
                  {isSelected ? <CheckSquare size={16} className="text-amber-400" /> : <Square size={16} />}
                </button>
                <div className="h-14 w-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0 ring-1 ring-zinc-700">
                  <img src={resolveThumbnailUrl(w) ?? `/wallpapers/${w.filename}`} alt={w.title}
                    className="w-full h-full object-cover" loading="lazy" />
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
        </div>
      )}
    </div>
  );
}
