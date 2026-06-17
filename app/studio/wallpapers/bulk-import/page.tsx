"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Upload,
  Link2,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import {
  upsertWallpaper,
  checkImageUrlExists,
} from "@/lib/wallpaper-store";
import { COLLECTIONS } from "@/lib/firestore-types";
import { getDB } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

function detectDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to load"));
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

function titleFromUrl(url: string, fallback: string): string {
  return url.split('/').pop()?.split('.')?.[0]?.replace(/[-_]/g, ' ')?.trim() || fallback;
}

const CONCURRENCY = 5;

interface ImportResult {
  url: string;
  status: "ok" | "duplicate" | "error";
  id?: string;
  title?: string;
  error?: string;
}

export default function BulkImportPage() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [urls, setUrls] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCreate = user && hasPermission(user, "wallpaper.create", roles);

  const handleImport = useCallback(async () => {
    if (!user) return;
    const lines = urls.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setImporting(true);
    setError(null);
    setResults(null);

    const out: ImportResult[] = [];
    let nextId = 1;

    try {
      const snap = await getDocs(
        query(collection(getDB(), COLLECTIONS.WALLPAPERS), orderBy("__name__", "desc"), limit(1))
      );
      snap.forEach((d) => {
        const id = Number(d.id);
        if (!isNaN(id)) nextId = id + 1;
      });
    } catch { /* ignore */ }

    // Process URLs concurrently in batches
    for (let i = 0; i < lines.length; i += CONCURRENCY) {
      const batch = lines.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (url) => {
          try {
            const exists = await checkImageUrlExists(url);
            if (exists) {
              return { url, status: "duplicate" as const };
            }
            let dims = { width: 0, height: 0 };
            try { dims = await detectDimensions(url); } catch { /* fallback */ }

            const id = String(nextId++);
            const title = titleFromUrl(url, `Wallpaper ${id}`);
            await upsertWallpaper({
              slug: id, id,
              title,
              description: "",
              categoryId: "abstract",
              tags: [],
              imageUrl: url,
              width: dims.width > 0 ? dims.width : undefined,
              height: dims.height > 0 ? dims.height : undefined,
              resolution: dims.width > 0 ? `${dims.width}x${dims.height}` : undefined,
              storageProvider: "github",
              published: false,
              visible: true,
              featured: false, trending: false,
              filename: `${id}.jpg`,
              uploaderId: user.uid,
              views: 0, downloads: 0, favorites: 0,
              titleLower: title.toLowerCase(),
              lastEditedBy: user.uid,
              lastEditedAt: new Date(),
            });
            return { url, status: "ok" as const, id, title };
          } catch (e) {
            return { url, status: "error" as const, error: e instanceof Error ? e.message : String(e) };
          }
        })
      );
      out.push(...batchResults);
    }

    setResults(out);
    setImporting(false);
  }, [user, urls]);

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
        <Link href="/" className="text-amber-500 hover:text-amber-400 underline">Go home</Link>
      </div>
    );
  }

  const okCount = results?.filter((r) => r.status === "ok").length ?? 0;
  const dupCount = results?.filter((r) => r.status === "duplicate").length ?? 0;
  const errCount = results?.filter((r) => r.status === "error").length ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/studio/wallpapers"
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Bulk Import</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-800/50 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {results && (
        <div className="mb-6 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-4 mb-3 text-sm">
            <span className="text-emerald-400">{okCount} created</span>
            {dupCount > 0 && <span className="text-amber-400">{dupCount} duplicates</span>}
            {errCount > 0 && <span className="text-red-400">{errCount} failed</span>}
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {r.status === "ok" ? (
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                ) : r.status === "duplicate" ? (
                  <AlertCircle size={12} className="text-amber-400 shrink-0" />
                ) : (
                  <AlertCircle size={12} className="text-red-400 shrink-0" />
                )}
                <span className="text-zinc-400 truncate flex-1">{r.url}</span>
                {r.status === "ok" && (
                  <Link href={`/studio/wallpapers/edit/${r.id}`} className="text-amber-400 hover:text-amber-300 shrink-0">
                    Edit
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm text-zinc-400 flex items-center gap-2">
          <Link2 size={14} />
          Paste one GitHub raw image URL per line. Each URL creates an unpublished draft with auto-detected dimensions.
        </p>
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder="https://raw.githubusercontent.com/.../image1.jpg&#10;https://raw.githubusercontent.com/.../image2.jpg&#10;https://raw.githubusercontent.com/.../image3.jpg"
          rows={12}
          disabled={importing}
          className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 font-mono text-sm resize-none"
        />
        <button
          onClick={handleImport}
          disabled={importing || !urls.trim()}
          className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium transition-all flex items-center justify-center gap-2"
        >
          {importing ? (
            <><Loader2 size={18} className="animate-spin" /> Importing…</>
          ) : (
            <><Upload size={18} /> Import {urls.split("\n").filter(Boolean).length} URLs</>
          )}
        </button>
      </div>
    </div>
  );
}
