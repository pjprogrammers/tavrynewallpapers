"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  FileJson,
  FileSpreadsheet,
  Database,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import { getAllWallpapersForStudio } from "@/lib/wallpaper-store";
import type { WallpaperMetadata } from "@/lib/firestore-types";

function toCSV(wallpapers: WallpaperMetadata[]): string {
  const headers = [
    "id", "title", "description", "imageUrl", "thumbnailUrl",
    "categoryId", "tags", "resolution", "width", "height",
    "orientation", "aspectRatio", "storageProvider",
    "published", "featured", "trending", "visible",
    "uploadDate", "createdBy", "updatedBy",
    "views", "downloads", "favorites",
  ];
  const rows = wallpapers.map((w) =>
    headers
      .map((h) => {
        const v = (w as any)[h];
        if (v === undefined || v === null) return "";
        if (Array.isArray(v)) return v.join("; ");
        if (typeof v === "boolean") return v ? "true" : "false";
        if (v instanceof Date) return v.toISOString();
        const s = String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function toJSON(wallpapers: WallpaperMetadata[]): string {
  const data = wallpapers.map((w) => ({
    id: w.id,
    slug: w.slug,
    title: w.title,
    description: w.description,
    imageUrl: w.imageUrl,
    thumbnailUrl: w.thumbnailUrl,
    categoryId: w.categoryId,
    tags: w.tags,
    resolution: w.resolution,
    width: w.width,
    height: w.height,
    orientation: w.orientation,
    aspectRatio: w.aspectRatio,
    storageProvider: w.storageProvider,
    filename: w.filename,
    published: w.published,
    featured: w.featured,
    trending: w.trending,
    visible: w.visible,
    deleted: w.deleted,
    uploadDate: w.uploadDate,
    uploaderId: w.uploaderId,
    createdBy: w.createdBy,
    lastEditedBy: w.lastEditedBy,
    updatedBy: w.updatedBy,
    views: w.views,
    downloads: w.downloads,
    favorites: w.favorites,
    createdAt: w.createdAt instanceof Date ? w.createdAt.toISOString() : w.createdAt,
    updatedAt: w.updatedAt instanceof Date ? w.updatedAt.toISOString() : w.updatedAt,
  }));
  return JSON.stringify(data, null, 2);
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [wallpapers, setWallpapers] = useState<WallpaperMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = user && hasPermission(user, "wallpaper.create", roles);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExported(false);
    try {
      const all = await getAllWallpapersForStudio(1000);
      setWallpapers(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallpapers");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !rolesLoading && canCreate) fetchData();
  }, [authLoading, rolesLoading, canCreate, fetchData]);

  const handleExportJSON = useCallback(() => {
    if (wallpapers.length === 0) return;
    const content = toJSON(wallpapers);
    const date = new Date().toISOString().slice(0, 10);
    downloadBlob(content, `wallpapers-${date}.json`, "application/json");
    setExported(true);
  }, [wallpapers]);

  const handleExportCSV = useCallback(() => {
    if (wallpapers.length === 0) return;
    const content = toCSV(wallpapers);
    const date = new Date().toISOString().slice(0, 10);
    downloadBlob(content, `wallpapers-${date}.csv`, "text/csv");
    setExported(true);
  }, [wallpapers]);

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
        <AlertCircle size={48} className="text-red-400" />
        <h2 className="text-xl font-semibold text-zinc-300">Access Denied</h2>
        <p className="text-zinc-500">You need moderator or admin privileges to export wallpapers.</p>
        <Link href="/" className="text-amber-500 hover:text-amber-400 underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Database size={24} className="text-emerald-400" />
        <h1 className="text-2xl font-bold text-zinc-100">Backup & Export</h1>
      </div>

      <div className="mb-8 p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl">
        <p className="text-sm text-zinc-400 leading-relaxed">
          Export all wallpapers as a JSON or CSV file. This is useful for backup, migration,
          disaster recovery, or transferring to a different hosting provider.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-800/50 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-200">Wallpaper Data</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {loading ? "Loading…" : `${wallpapers.length} wallpaper${wallpapers.length === 1 ? "" : "s"} loaded`}
              </p>
            </div>
            {!loading && wallpapers.length > 0 && (
              <button onClick={fetchData} className="text-xs text-zinc-500 hover:text-zinc-300 underline">
                Refresh
              </button>
            )}
          </div>

          {wallpapers.length === 0 && !loading && (
            <p className="text-sm text-zinc-600">No wallpapers to export.</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={handleExportJSON} disabled={loading || wallpapers.length === 0}
            className="flex items-center gap-4 p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left">
            <FileJson size={32} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Export as JSON</p>
              <p className="text-xs text-zinc-500 mt-0.5">Full data with nested fields, readable format</p>
            </div>
            <Download size={18} className="text-zinc-500 ml-auto shrink-0" />
          </button>

          <button onClick={handleExportCSV} disabled={loading || wallpapers.length === 0}
            className="flex items-center gap-4 p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left">
            <FileSpreadsheet size={32} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Export as CSV</p>
              <p className="text-xs text-zinc-500 mt-0.5">Spreadsheet format, import into Excel/Google Sheets</p>
            </div>
            <Download size={18} className="text-zinc-500 ml-auto shrink-0" />
          </button>
        </div>

        {exported && (
          <div className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-800/50 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-emerald-200 text-sm">
              Export complete. The file was downloaded to your computer. Keep it safe for disaster recovery.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
