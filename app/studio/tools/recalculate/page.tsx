"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import {
  getAllWallpapersFromFirestore,
  upsertWallpaper,
} from "@/lib/wallpaper-store";
import type { WallpaperMetadata } from "@/lib/firestore-types";

function detectDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to load"));
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

function detectStorageProvider(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("raw.githubusercontent.com") || u.hostname === "github.com") return "github";
    if (u.hostname.includes("r2.cloudflarestorage.com") || u.hostname.includes(".r2.dev")) return "cloudflare-r2";
    if (u.hostname.includes("cloudinary.com") || u.hostname.includes("res.cloudinary.com")) return "cloudinary";
    if (u.hostname.includes("firebasestorage.googleapis.com")) return "firebase-storage";
    return "other";
  } catch { return "other"; }
}

interface WallpaperFix {
  slug: string;
  id: string;
  title: string;
  fixed: string[];
}

export default function RecalculatePage() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<WallpaperFix[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  const canEdit = user && hasPermission(user, "wallpaper.edit", roles);

  const handleRecalculate = useCallback(async () => {
    if (!user) return;
    setProcessing(true);
    setError(null);
    setResults(null);

    try {
      const all = await getAllWallpapersFromFirestore(500);
      const fixes: WallpaperFix[] = [];

      for (const w of all) {
        setCurrent(w.title);
        const fixed: string[] = [];
        const update: Record<string, unknown> = {};

        // Recalculate aspect ratio
        if (w.width && w.height && w.width > 0 && w.height > 0) {
          const g = (a: number, b: number): number => (b === 0 ? a : g(b, a % b));
          const gcd = g(w.width, w.height);
          const ratio = `${w.width / gcd}:${w.height / gcd}`;
          if (w.aspectRatio !== ratio) {
            update.aspectRatio = ratio;
            fixed.push("aspectRatio");
          }
        }

        // Detect storage provider from image URL
        if (w.imageUrl) {
          const provider = detectStorageProvider(w.imageUrl);
          if (w.storageProvider !== provider) {
            update.storageProvider = provider;
            fixed.push("storageProvider");
          }
        }

        if (fixed.length > 0) {
          await upsertWallpaper({
            ...w,
            ...update,
            lastEditedBy: user.uid,
            lastEditedAt: new Date(),
          } as any);
          fixes.push({ slug: w.slug, id: w.id, title: w.title, fixed });
        }
      }

      setResults(fixes);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessing(false);
      setCurrent(null);
    }
  }, [user]);

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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/studio"
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Recalculate Metadata</h1>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-zinc-400">
          Scans all wallpapers and recalculates <code className="text-amber-400">aspectRatio</code> from width/height
          and <code className="text-amber-400">storageProvider</code> from the image URL.
        </p>

        {error && (
          <div className="p-4 rounded-xl bg-red-900/30 border border-red-800/50 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {results && (
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center gap-2 mb-3 text-sm">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span className="text-zinc-200">Updated {results.length} wallpaper{results.length === 1 ? "" : "s"}</span>
            </div>
            {results.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {results.map((r) => (
                  <div key={r.slug} className="text-xs text-zinc-400">
                    <span className="text-zinc-300">{r.title}</span>
                    <span className="text-zinc-600"> &mdash; </span>
                    {r.fixed.join(", ")}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {current && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 size={14} className="animate-spin text-amber-400" />
            Processing: {current}
          </div>
        )}

        <button onClick={handleRecalculate} disabled={processing}
          className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium transition-all flex items-center justify-center gap-2">
          {processing ? (
            <><Loader2 size={18} className="animate-spin" /> Processing…</>
          ) : (
            <><RefreshCw size={18} /> Recalculate All Wallpapers</>
          )}
        </button>
      </div>
    </div>
  );
}
