"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Loader2, Plus, Pencil, Trash2, Layers, Tag, AlertCircle, X, Search,
  Merge, ArrowRight, ImageIcon, Download, Heart, Eye, EyeOff, ExternalLink,
  CheckSquare, Square, Upload, Edit3, List, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import {
  listCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getAllCategoryCounts,
} from "@/lib/category-store";
import {
  listTags,
  addTag,
  updateTag,
  deleteTag,
  renameTag,
  mergeTags,
  getAllTagCounts,
} from "@/lib/tag-store";
import {
  getAllWallpapersForStudio,
  softDeleteWallpaper,
  batchUpdateWallpapers,
} from "@/lib/wallpaper-store";
import { resolveThumbnailUrl } from "@/lib/wallpaper-image";
import type { WallpaperMetadata, CategoryDoc, TagDoc } from "@/lib/firestore-types";
import { createSlug } from "@/lib/slug";

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

export default function StudioPage() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();

  // Wallpapers state
  const [wallpapers, setWallpapers] = useState<WallpaperMetadata[]>([]);
  const [wallpaperLoading, setWallpaperLoading] = useState(true);

  // Categories state
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [categoryLoading, setCategoryLoading] = useState(true);

  // Tags state
  const [tags, setTags] = useState<TagDoc[]>([]);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [tagLoading, setTagLoading] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState<"wallpapers" | "categories" | "tags">("wallpapers");

  // Wallpapers filters
  const [wallpaperSearch, setWallpaperSearch] = useState("");
  const [wallpaperSortBy, setWallpaperSortBy] = useState<SortKey>("updated");
  const [wallpaperDeleting, setWallpaperDeleting] = useState<string | null>(null);
  const [wallpaperSelected, setWallpaperSelected] = useState<Set<string>>(new Set());
  const [wallpaperBatchBusy, setWallpaperBatchBusy] = useState(false);

  // Categories filters
  const [categorySearch, setCategorySearch] = useState("");

  // Tags filters
  const [tagSearch, setTagSearch] = useState("");
  const [tagMergeOpen, setTagMergeOpen] = useState(false);
  const [tagMergeSource, setTagMergeSource] = useState("");
  const [tagMergeTarget, setTagMergeTarget] = useState("");
  const [tagMerging, setTagMerging] = useState(false);

  // Categories form state
  const [showCategoryAdd, setShowCategoryAdd] = useState(false);
  const [categoryEditId, setCategoryEditId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ id: "", name: "", description: "" });
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categoryBulkMode, setCategoryBulkMode] = useState(false);
  const [categoryBulkInput, setCategoryBulkInput] = useState("");
  const [categoryBulkResults, setCategoryBulkResults] = useState<string[] | null>(null);

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Tags form state
  const [showTagAdd, setShowTagAdd] = useState(false);
  const [tagAddName, setTagAddName] = useState("");
  const [tagEditId, setTagEditId] = useState<string | null>(null);
  const [tagEditName, setTagEditName] = useState("");
  const [tagSaving, setTagSaving] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagBulkMode, setTagBulkMode] = useState(false);
  const [tagBulkInput, setTagBulkInput] = useState("");
  const [tagBulkResults, setTagBulkResults] = useState<string[] | null>(null);

  const canEdit = user && hasPermission(user, "wallpaper.edit", roles);
  const canDelete = user && hasPermission(user, "wallpaper.delete", roles);

  // Load all data
  const loadAll = useCallback(async () => {
    if (!canEdit) return;

    try {
      setWallpaperLoading(true);
      setCategoryLoading(true);
      setTagLoading(true);

      const [wallpapersData, categoriesData, tagsData] = await Promise.all([
        getAllWallpapersForStudio(500, "updatedAt", "desc"),
        listCategories().catch(() => []),
        listTags().catch(() => []),
      ]);

      const [categoryCountsData, tagCountsData] = await Promise.all([
        getAllCategoryCounts().catch(() => ({})),
        getAllTagCounts().catch(() => ({})),
      ]);

      setWallpapers(wallpapersData);
      setCategories(categoriesData);
      setCategoryCounts(categoryCountsData);
      setTags(tagsData);
      setTagCounts(tagCountsData);
    } catch (err) {
      console.error("[Studio] Failed to load data:", err);
    } finally {
      setWallpaperLoading(false);
      setCategoryLoading(false);
      setTagLoading(false);
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
    const all = await getAllWallpapersForStudio(500, field, dir);
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

  // Categories functions
  const handleCategoryAdd = async () => {
    if (!categoryForm.id.trim() || !categoryForm.name.trim()) return;
    setCategorySaving(true);
    setCategoryError(null);
    try {
      await addCategory(
        categoryForm.id.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        categoryForm.name.trim(),
        categoryForm.description.trim() || undefined,
      );
      setShowCategoryAdd(false);
      setCategoryForm({ id: "", name: "", description: "" });
      await loadAll();
    } catch (e) {
      setCategoryError(e instanceof Error ? e.message : "Failed to add category");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleCategoryUpdate = async () => {
    if (!categoryEditId || !categoryForm.name.trim()) return;
    setCategorySaving(true);
    setCategoryError(null);
    try {
      await updateCategory(categoryEditId, {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || undefined,
      });
      setCategoryEditId(null);
      setCategoryForm({ id: "", name: "", description: "" });
      await loadAll();
    } catch (e) {
      setCategoryError(e instanceof Error ? e.message : "Failed to update category");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm(`Delete category "${id}"? Wallpapers in this category will keep their current categoryId.`)) return;
    try {
      await deleteCategory(id);
      await loadAll();
    } catch (e) {
      setCategoryError(e instanceof Error ? e.message : "Failed to delete category");
    }
  };

  const handleCategoryBulkAdd = async () => {
    const names = categoryBulkInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (names.length === 0) return;
    setCategorySaving(true);
    setCategoryError(null);
    const created: string[] = [];
    for (const name of names) {
      try {
        const id = slugify(name);
        if (!id) continue;
        await addCategory(id, name);
        created.push(name);
      } catch { /* skip duplicates silently */ }
    }
    setCategoryBulkInput("");
    setCategoryBulkResults(created);
    setCategoryBulkMode(false);
    await loadAll();
  };

  const openCategoryEdit = (cat: CategoryDoc) => {
    setCategoryEditId(cat.id);
    setCategoryForm({ id: cat.id, name: cat.name, description: cat.description ?? "" });
    setShowCategoryAdd(false);
  };

  const categoryFiltered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      c.id.includes(categorySearch.toLowerCase()),
  );

  // Tags functions
  const handleTagAdd = async () => {
    if (!tagAddName.trim()) return;
    setTagSaving(true);
    setTagError(null);
    try {
      const id = tagAddName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      if (!id) { setTagError("Invalid tag name."); return; }
      await addTag(tagAddName.trim());
      setShowTagAdd(false);
      setTagAddName("");
      await loadAll();
    } catch (e) {
      setTagError(e instanceof Error ? e.message : "Failed to add tag");
    } finally {
      setTagSaving(false);
    }
  };

  const handleTagUpdate = async () => {
    if (!tagEditId || !tagEditName.trim()) return;
    setTagSaving(true);
    setTagError(null);
    try {
      await updateTag(tagEditId, { name: tagEditName.trim() });
      setTagEditId(null);
      setTagEditName("");
      await loadAll();
    } catch (e) {
      setTagError(e instanceof Error ? e.message : "Failed to update tag");
    } finally {
      setTagSaving(false);
    }
  };

  const handleTagDelete = async (id: string) => {
    if (!confirm(`Delete tag "${id}"? This does NOT remove it from wallpapers.`)) return;
    try {
      await deleteTag(id);
      await loadAll();
    } catch (e) {
      setTagError(e instanceof Error ? e.message : "Failed to delete tag");
    }
  };

  const startTagEdit = (tag: TagDoc) => {
    setTagEditId(tag.id);
    setTagEditName(tag.name);
    setShowTagAdd(false);
  };

  const handleTagBulkAdd = async () => {
    const names = tagBulkInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (names.length === 0) return;
    setTagSaving(true);
    setTagError(null);
    const created: string[] = [];
    for (const name of names) {
      try {
        const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        if (!id) continue;
        await addTag(name);
        created.push(name);
      } catch { /* skip duplicates silently */ }
    }
    setTagBulkInput("");
    setTagBulkResults(created);
    setTagBulkMode(false);
    await loadAll();
  };

  const handleTagRename = async () => {
    if (!tagEditId || !tagEditName.trim()) return;
    setTagSaving(true);
    setTagError(null);
    try {
      await renameTag(
        tagEditId,
        tagEditId.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        tagEditName.trim() || undefined,
      );
      setTagEditId(null);
      setTagEditName("");
      await loadAll();
    } catch (e) {
      setTagError(e instanceof Error ? e.message : "Failed to rename tag");
    } finally {
      setTagSaving(false);
    }
  };

  const handleTagMerge = async () => {
    if (!tagMergeSource || !tagMergeTarget || tagMergeSource === tagMergeTarget) return;
    if (!confirm(`Merge "${tagMergeSource}" → "${tagMergeTarget}"? All wallpapers with "${tagMergeSource}" will be updated.`)) return;
    setTagMerging(true);
    setTagError(null);
    try {
      await mergeTags(tagMergeSource, tagMergeTarget);
      setTagMergeOpen(false);
      setTagMergeSource("");
      setTagMergeTarget("");
      await loadAll();
    } catch (e) {
      setTagError(e instanceof Error ? e.message : "Failed to merge tags");
    } finally {
      setTagMerging(false);
    }
  };

  const tagFiltered = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
      t.id.includes(tagSearch.toLowerCase()),
  );

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

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("wallpapers")}
          className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${activeTab === "wallpapers" ? "border-amber-500 text-amber-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
        >
          Wallpapers ({wallpapers.length})
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${activeTab === "categories" ? "border-amber-500 text-amber-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("tags")}
          className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${activeTab === "tags" ? "border-amber-500 text-amber-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
        >
          Tags ({tags.length})
        </button>
      </div>

      {/* Error Message */}
      {(categoryError || tagError) && (
        <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-800/50 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{categoryError || tagError}</p>
          <button onClick={() => { setCategoryError(null); setTagError(null); }} className="ml-auto text-red-400 hover:text-red-200"><X size={16} /></button>
        </div>
      )}

      {/* Wallpapers Tab */}
      {activeTab === "wallpapers" && (
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
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Layers size={24} className="text-amber-500" />
              <h1 className="text-2xl font-bold text-zinc-100">Categories</h1>
              <span className="text-sm text-zinc-500">({categories.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setCategoryBulkMode(true); setCategoryBulkInput(""); setCategoryBulkResults(null); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all"
              >
                <List size={16} /> Bulk Add
              </button>
              <button
                onClick={() => { setShowCategoryAdd(true); setCategoryEditId(null); setCategoryForm({ id: "", name: "", description: "" }); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-all"
              >
                <Plus size={16} /> Add Category
              </button>
            </div>
          </div>

          {categoryBulkMode && (
            <div className="mb-8 p-6 rounded-xl bg-zinc-900/70 border border-zinc-700">
              <h3 className="text-lg font-semibold text-zinc-200 mb-2">Bulk Add Categories</h3>
              <p className="text-sm text-zinc-500 mb-4">Enter category names separated by commas. Slugs will be auto-generated.</p>
              <textarea value={categoryBulkInput} onChange={(e) => setCategoryBulkInput(e.target.value)}
                rows={4} placeholder="Cyberpunk, Nature, Anime, Gaming, Abstract"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-4" />
              <div className="flex gap-3">
                <button onClick={handleCategoryBulkAdd} disabled={categorySaving || !categoryBulkInput.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-all">
                  {categorySaving ? "Creating..." : `Create ${categoryBulkInput.split(",").filter(Boolean).length} categories`}
                </button>
                <button onClick={() => { setCategoryBulkMode(false); setCategoryBulkResults(null); }}
                  className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {categoryBulkResults && categoryBulkResults.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-900/30 border border-emerald-800/50 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-emerald-200 text-sm">Created: {categoryBulkResults.join(", ")}</p>
              <button onClick={() => setCategoryBulkResults(null)} className="ml-auto text-emerald-400 hover:text-emerald-200"><X size={16} /></button>
            </div>
          )}

          {(showCategoryAdd || categoryEditId) && (
            <div className="mb-8 p-6 rounded-xl bg-zinc-900/70 border border-zinc-700">
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">
                {categoryEditId ? "Edit Category" : "Add Category"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">ID (URL slug)</label>
                  <input
                    type="text"
                    value={categoryForm.id}
                    onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value })}
                    disabled={!!categoryEditId}
                    placeholder="e.g. cyberpunk"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 disabled:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g. Cyberpunk"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    rows={2}
                    placeholder="Optional description"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={categoryEditId ? handleCategoryUpdate : handleCategoryAdd}
                    disabled={categorySaving || !categoryForm.id.trim() || !categoryForm.name.trim()}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-all"
                  >
                    {categorySaving ? "Saving..." : categoryEditId ? "Update" : "Create"}
                  </button>
                  <button
                    onClick={() => { setShowCategoryAdd(false); setCategoryEditId(null); setCategoryForm({ id: "", name: "", description: "" }); }}
                    className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Search categories…"
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {categoryLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-zinc-500" />
            </div>
          ) : categoryFiltered.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              {categorySearch ? "No categories match your search." : "No categories yet. Add one above."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-900/80">
                    <th className="text-left px-4 py-3 text-zinc-400 font-medium">ID</th>
                    <th className="text-left px-4 py-3 text-zinc-400 font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-zinc-400 font-medium">Description</th>
                    <th className="text-right px-4 py-3 text-zinc-400 font-medium">Wallpapers</th>
                    <th className="text-right px-4 py-3 text-zinc-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {categoryFiltered.map((cat) => (
                    <tr key={cat.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{cat.id}</td>
                      <td className="px-4 py-3 text-zinc-100 font-medium">{cat.name}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs max-w-[200px] truncate">{cat.description || "—"}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{categoryCounts[cat.id] ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openCategoryEdit(cat)} className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 transition-all">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleCategoryDelete(cat.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tags Tab */}
      {activeTab === "tags" && (
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Tag size={24} className="text-amber-500" />
              <h1 className="text-2xl font-bold text-zinc-100">Tags</h1>
              <span className="text-sm text-zinc-500">({tags.length})</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setTagBulkMode(true); setTagBulkInput(""); setTagBulkResults(null); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all"
              >
                <List size={16} /> Bulk Add
              </button>
              <button
                onClick={() => setTagMergeOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all"
              >
                <Merge size={16} /> Merge Tags
              </button>
              <button
                onClick={() => { setShowTagAdd(true); setTagAddName(""); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-all"
              >
                <Plus size={16} /> Add Tag
              </button>
            </div>
          </div>

          {tagError && (
            <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-800/50 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{tagError}</p>
              <button onClick={() => setTagError(null)} className="ml-auto text-red-400 hover:text-red-200"><X size={16} /></button>
            </div>
          )}

          {tagBulkMode && (
            <div className="mb-8 p-6 rounded-xl bg-zinc-900/70 border border-zinc-700">
              <h3 className="text-lg font-semibold text-zinc-200 mb-2">Bulk Add Tags</h3>
              <p className="text-sm text-zinc-500 mb-4">Enter tag names separated by commas. IDs will be auto-generated.</p>
              <textarea value={tagBulkInput} onChange={(e) => setTagBulkInput(e.target.value)}
                rows={4} placeholder="4K, HDR, Minimalist, Dark, Neon"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-4" />
              <div className="flex gap-3">
                <button onClick={handleTagBulkAdd} disabled={tagSaving || !tagBulkInput.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-all">
                  {tagSaving ? "Creating..." : `Create ${tagBulkInput.split(",").filter(Boolean).length} tags`}
                </button>
                <button onClick={() => { setTagBulkMode(false); setTagBulkResults(null); }}
                  className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {tagBulkResults && tagBulkResults.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-900/30 border border-emerald-800/50 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-emerald-200 text-sm">Created: {tagBulkResults.join(", ")}</p>
              <button onClick={() => setTagBulkResults(null)} className="ml-auto text-emerald-400 hover:text-emerald-200"><X size={16} /></button>
            </div>
          )}

          {showTagAdd && (
            <div className="mb-8 p-6 rounded-xl bg-zinc-900/70 border border-zinc-700">
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">Add Tag</h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={tagAddName}
                    onChange={(e) => setTagAddName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTagAdd()}
                    placeholder="e.g. Cyberpunk"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">ID will be auto-generated: lowercase, hyphens for spaces.</p>
                </div>
                <button
                  onClick={handleTagAdd}
                  disabled={tagSaving || !tagAddName.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-all"
                >
                  {tagSaving ? "Saving..." : "Create"}
                </button>
                <button
                  onClick={() => setShowTagAdd(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {tagEditId && (
            <div className="mb-8 p-6 rounded-xl bg-zinc-900/70 border border-zinc-700">
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">Edit Tag</h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={tagEditName}
                    onChange={(e) => setTagEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTagUpdate()}
                    placeholder="e.g. Cyberpunk"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <button
                  onClick={handleTagUpdate}
                  disabled={tagSaving || !tagEditName.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-all"
                >
                  {tagSaving ? "Saving..." : "Update"}
                </button>
                <button
                  onClick={() => { setTagEditId(null); setTagEditName(""); }}
                  className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {tagMergeOpen && (
            <div className="mb-8 p-6 rounded-xl bg-zinc-900/70 border border-zinc-700">
              <h3 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                <Merge size={18} /> Merge Tags
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                Merge all wallpapers from one tag into another. The source tag will be deleted.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Source (will be merged FROM)</label>
                  <select value={tagMergeSource} onChange={(e) => setTagMergeSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                    <option value="">Select source tag…</option>
                    {tags.filter((t) => t.id !== tagMergeTarget).map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.id}) — {tagCounts[t.id] ?? 0}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Target (will receive wallpapers)</label>
                  <select value={tagMergeTarget} onChange={(e) => setTagMergeTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                    <option value="">Select target tag…</option>
                    {tags.filter((t) => t.id !== tagMergeSource).map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.id}) — {tagCounts[t.id] ?? 0}</option>
                    ))}
                  </select>
                </div>
              </div>
              {tagMergeSource && tagMergeTarget && tagMergeSource !== tagMergeTarget && (
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-sm text-zinc-400">{tagCounts[tagMergeSource] ?? 0} wallpapers will move</span>
                  <ArrowRight size={16} className="text-zinc-500" />
                  <button onClick={handleTagMerge} disabled={tagMerging}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 text-white text-sm font-medium transition-all">
                    {tagMerging ? "Merging..." : `Merge into "${tagMergeTarget}"`}
                  </button>
                  <button onClick={() => setTagMergeOpen(false)} className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all">Cancel</button>
                </div>
              )}
            </div>
          )}

          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" value={tagSearch} onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Search tags…" className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>

          {tagLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-zinc-500" />
            </div>
          ) : tagFiltered.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              {tagSearch ? "No tags match your search." : "No tags yet. Add one above."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-900/80">
                    <th className="text-left px-4 py-3 text-zinc-400 font-medium">ID</th>
                    <th className="text-left px-4 py-3 text-zinc-400 font-medium">Name</th>
                    <th className="text-right px-4 py-3 text-zinc-400 font-medium">Wallpapers</th>
                    <th className="text-right px-4 py-3 text-zinc-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {tagFiltered.map((tag) => (
                    <tr key={tag.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{tag.id}</td>
                      <td className="px-4 py-3 text-zinc-100 font-medium">{tag.name}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{tagCounts[tag.id] ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startTagEdit(tag)} className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 transition-all" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleTagDelete(tag.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}