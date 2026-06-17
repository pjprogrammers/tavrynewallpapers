"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  TrendingUp,
  Eye,
  Download,
  Heart,
  ImageIcon,
  ArrowLeft,
  BarChart3,
  Bookmark,
  MousePointerClick,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { getAllWallpapersFromFirestore } from "@/lib/wallpaper-store";
import type { WallpaperMetadata } from "@/lib/firestore-types";

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

interface Stats {
  total: number;
  views: number;
  downloads: number;
  favorites: number;
  featured: number;
  trending: number;
  draft: number;
  hidden: number;
}

export default function AdminAnalyticsPage() {
  const { loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [wallpapers, setWallpapers] = useState<WallpaperMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = roles.admin === true;

  const fetch = useCallback(async () => {
    setLoading(true);
    const all = await getAllWallpapersFromFirestore(500);
    setWallpapers(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !rolesLoading && isAdmin) fetch();
  }, [authLoading, rolesLoading, isAdmin, fetch]);

  const stats: Stats = {
    total: wallpapers.filter((w) => !w.deleted).length,
    views: wallpapers.reduce((s, w) => s + (w.views ?? 0), 0),
    downloads: wallpapers.reduce((s, w) => s + (w.downloads ?? 0), 0),
    favorites: wallpapers.reduce((s, w) => s + (w.favorites ?? 0), 0),
    featured: wallpapers.filter((w) => w.featured && !w.deleted).length,
    trending: wallpapers.filter((w) => w.trending && !w.deleted).length,
    draft: wallpapers.filter((w) => !w.published && !w.deleted).length,
    hidden: wallpapers.filter((w) => !w.visible && !w.deleted).length,
  };

  const topViewed = [...wallpapers]
    .filter((w) => !w.deleted)
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 10);

  const topDownloaded = [...wallpapers]
    .filter((w) => !w.deleted)
    .sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0))
    .slice(0, 10);

  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-zinc-500">Admin access required.</p>
        <Link href="/admin" className="text-amber-500 hover:text-amber-400 underline">Back to admin</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin"
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all">
          <ArrowLeft size={20} />
        </Link>
        <BarChart3 size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-8">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Wallpapers", value: stats.total, icon: ImageIcon, color: "from-emerald-500 to-emerald-600" },
              { label: "Views", value: fmtCompact(stats.views), icon: Eye, color: "from-blue-500 to-blue-600" },
              { label: "Downloads", value: fmtCompact(stats.downloads), icon: Download, color: "from-violet-500 to-violet-600" },
              { label: "Favorites", value: fmtCompact(stats.favorites), icon: Heart, color: "from-rose-500 to-rose-600" },
              { label: "Favorites", value: fmtCompact(stats.favorites), icon: Bookmark, color: "from-pink-500 to-pink-600" },
              { label: "Featured", value: stats.featured, icon: TrendingUp, color: "from-amber-500 to-amber-600" },
              { label: "Drafts", value: stats.draft, icon: ImageIcon, color: "from-amber-500 to-amber-600" },
              { label: "Hidden", value: stats.hidden, icon: Eye, color: "from-zinc-500 to-zinc-600" },
              { label: "Trending", value: stats.trending, icon: TrendingUp, color: "from-cyan-500 to-cyan-600" },
            ].map((card) => (
              <div key={card.label}
                className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                  <card.icon size={15} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-xs text-zinc-400 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Eye size={14} className="text-blue-400" /> Top Viewed
              </h3>
              <div className="space-y-2">
                {topViewed.map((w, i) => (
                  <div key={w.slug} className="flex items-center gap-3 text-xs">
                    <span className="w-5 text-zinc-500 font-bold text-center">{i + 1}</span>
                    <span className="text-zinc-300 truncate flex-1">{w.title}</span>
                    <span className="text-blue-400 font-mono">{fmtCompact(w.views ?? 0)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Download size={14} className="text-violet-400" /> Top Downloaded
              </h3>
              <div className="space-y-2">
                {topDownloaded.map((w, i) => (
                  <div key={w.slug} className="flex items-center gap-3 text-xs">
                    <span className="w-5 text-zinc-500 font-bold text-center">{i + 1}</span>
                    <span className="text-zinc-300 truncate flex-1">{w.title}</span>
                    <span className="text-violet-400 font-mono">{fmtCompact(w.downloads ?? 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
