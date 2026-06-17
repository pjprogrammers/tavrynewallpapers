"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { createSlug } from "@/lib/slug";
import {
  Shield,
  ShieldCheck,
  Users,
  Image as ImageIcon,
  History,
  Loader2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  EyeOff,
  Eye,
  Heart,
  Download,
  BarChart3,
  Layers,
  Clock,
  Sparkles,
  TrendingUp,
  UserPlus,
  LayoutDashboard,
  Hash,
  ArrowUpRight,
  Settings,
  Upload,
  Bookmark,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import {
  getAllWallpapersFromFirestore,
  getDraftsFromFirestore,
  getRecentEditsFromFirestore,
} from "@/lib/wallpaper-store";
import {
  getAdminsFromFirestore,
  getModeratorsFromFirestore,
  type UserSummary,
} from "@/lib/users";
import type { WallpaperMetadata, WallpaperEdit } from "@/lib/firestore-types";
import { resolveThumbnailUrl } from "@/lib/wallpaper-image";

type Tab = "overview" | "team" | "wallpapers" | "edits" | "drafts";

interface OverviewData {
  admins: UserSummary[];
  moderators: UserSummary[];
  wallpapers: WallpaperMetadata[];
  drafts: WallpaperMetadata[];
  recentEdits: WallpaperEdit[];
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function relativeTime(iso: string | Date): string {
  const t = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - t.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return t.toLocaleDateString();
}

function editTimestampMs(editedAt: unknown): number {
  if (!editedAt) return 0;
  if (typeof editedAt === "object" && "toDate" in (editedAt as object))
    return (editedAt as { toDate: () => Date }).toDate().getTime();
  if (editedAt instanceof Date) return editedAt.getTime();
  return 0;
}

const STAT_CARDS_CONFIG = [
  {
    label: "Total Wallpapers",
    icon: ImageIcon,
    gradient: "from-emerald-500 to-emerald-600",
    glow: "shadow-emerald-500/20",
  },
  {
    label: "Total Views",
    icon: Eye,
    gradient: "from-blue-500 to-blue-600",
    glow: "shadow-blue-500/20",
  },
  {
    label: "Total Downloads",
    icon: Download,
    gradient: "from-violet-500 to-violet-600",
    glow: "shadow-violet-500/20",
  },
  {
    label: "Total Favorites",
    icon: Heart,
    gradient: "from-rose-500 to-rose-600",
    glow: "shadow-rose-500/20",
  },
  {
    label: "Drafts",
    icon: EyeOff,
    gradient: "from-amber-500 to-amber-600",
    glow: "shadow-amber-500/20",
  },
  {
    label: "Edits (24h)",
    icon: History,
    gradient: "from-cyan-500 to-cyan-600",
    glow: "shadow-cyan-500/20",
  },
  {
    label: "Favorites",
    icon: Bookmark,
    gradient: "from-pink-500 to-pink-600",
    glow: "shadow-pink-500/20",
  },
];

function ActivityChart({ edits }: { edits: WallpaperEdit[] }) {
  const bars = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en", { weekday: "short" });
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      const count = edits.filter((e) => {
        const t = editTimestampMs(e.editedAt);
        return t >= dayStart.getTime() && t <= dayEnd.getTime();
      }).length;
      days.push({ label, count });
    }
    return days;
  }, [edits]);

  const max = Math.max(1, ...bars.map((b) => b.count));

  return (
    <div className="flex items-end justify-between gap-1.5 h-28">
      {bars.map((b) => (
        <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground/70">
            {b.count > 0 ? b.count : ""}
          </span>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(b.count / max) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full rounded-sm bg-gradient-to-t from-primary to-primary/40"
            style={{ minHeight: b.count > 0 ? "4px" : "0" }}
          />
          <span className="text-[10px] text-muted-foreground/60">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

function RelativeTime({ date }: { date: Date | undefined }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const update = () => setLabel(date ? relativeTime(date) : "");
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [date]);
  return <>{label}</>;
}

function Avatar({ src, name, size = "md" }: { src?: string | null; name: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size === "sm" ? 32 : size === "lg" ? 48 : 40}
        height={size === "sm" ? 32 : size === "lg" ? 48 : 40}
        className={`${dim} rounded-full object-cover shrink-0 ring-1 ring-border`}
        unoptimized
      />
    );
  }
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-primary/80 to-primary/30 flex items-center justify-center text-white font-bold shrink-0 ring-1 ring-white/10`}>
      {initial}
    </div>
  );
}

function CategorySplit({ wallpapers }: { wallpapers: WallpaperMetadata[] }) {
  const buckets = useMemo(() => {
    const m = new Map<string, number>();
    wallpapers.forEach((w) => m.set(w.categoryId, (m.get(w.categoryId) ?? 0) + 1));
    return Array.from(m.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [wallpapers]);
  const max = Math.max(1, ...buckets.map((b) => b.count));

  if (buckets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 text-muted-foreground">
        <ImageIcon size={20} className="opacity-40" />
        <p className="text-xs mt-1 opacity-60">No wallpapers yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {buckets.map((b) => {
        const pct = Math.round((b.count / max) * 100);
        return (
          <div key={b.id}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground capitalize">{b.id}</span>
              <span className="text-muted-foreground/60 font-mono">{b.count}</span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/40"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminContent() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const isAdmin = roles.admin === true;
  const isModerator = roles.moderator === true;

  const refresh = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const [admins, moderators, wallpapers, drafts, recentEdits] =
        await Promise.all([
          getAdminsFromFirestore(100),
          getModeratorsFromFirestore(100),
          getAllWallpapersFromFirestore(200),
          getDraftsFromFirestore(200),
          getRecentEditsFromFirestore(30),
        ]);
      setData({ admins, moderators, wallpapers, drafts, recentEdits });
      setLastRefreshed(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin, refresh]);

  const filteredWallpapers = useMemo(() => {
    if (!data) return [];
    if (!search) return data.wallpapers;
    const s = search.toLowerCase();
    return data.wallpapers.filter(
      (w) =>
        w.title.toLowerCase().includes(s) ||
        w.slug.toLowerCase().includes(s) ||
        w.categoryId.toLowerCase().includes(s) ||
        (w.tags ?? []).some((t) => t.toLowerCase().includes(s))
    );
  }, [data, search]);

  const adminWallpapers = useMemo(() => data?.wallpapers ?? [], [data]);

  const topDownloaded = useMemo(
    () => [...adminWallpapers].sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0)).slice(0, 5),
    [adminWallpapers]
  );

  const topViewed = useMemo(
    () => [...adminWallpapers].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5),
    [adminWallpapers]
  );

  const tabMeta = useMemo(() => {
    const s = adminWallpapers;
    const drafts = data?.drafts ?? [];
    const edits = data?.recentEdits ?? [];
    const admins = data?.admins ?? [];
    const moderators = data?.moderators ?? [];
    return { s, drafts, edits, admins, moderators };
  }, [adminWallpapers, data]);

  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 p-10 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <Loader2 size={36} className="animate-spin text-primary relative" />
          </div>
          <p className="text-sm text-zinc-400">Checking access&hellip;</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="flex flex-col items-center gap-5 p-10 rounded-2xl bg-zinc-900/50 border border-zinc-800 max-w-md text-center backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <Shield size={52} className="text-primary relative" />
          </div>
          <h1 className="text-xl font-bold text-white">Sign in required</h1>
          <p className="text-sm text-zinc-400">
            You must be signed in to access the admin dashboard.
          </p>
          <div className="flex gap-3 mt-2">
            <Link
              href={`/login?redirect=${encodeURIComponent("/admin")}`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-all text-sm shadow-lg shadow-primary/25"
            >
              Sign in <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-zinc-700 rounded-lg hover:border-primary/40 transition-all text-sm text-zinc-300 hover:text-white"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="flex flex-col items-center gap-5 p-10 rounded-2xl bg-zinc-900/50 border border-zinc-800 max-w-md text-center backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full" />
            <AlertTriangle size={52} className="text-amber-400 relative" />
          </div>
          <h1 className="text-xl font-bold text-white">Access denied</h1>
          <p className="text-sm text-zinc-400">
            Signed in as <strong className="text-white">{user.email}</strong>, but your
            account does not have the <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-primary">admin</code> role.
          </p>
          {isModerator && (
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-blue-400" />
              You have the <code className="px-1 bg-zinc-800 rounded text-xs">moderator</code> role.
              You can edit any wallpaper from its detail page.
            </p>
          )}
          <p className="text-xs text-zinc-500 mt-1">
            Ask an existing admin to run:<br />
            <code className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-primary">npm run role add {user.email} admin</code>
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-zinc-700 rounded-lg hover:border-primary/40 transition-all text-sm text-zinc-300 hover:text-white mt-2"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const { s, drafts, edits, admins, moderators } = tabMeta;

  const totalViews = s.reduce((a, w) => a + (w.views ?? 0), 0);
  const totalDownloads = s.reduce((a, w) => a + (w.downloads ?? 0), 0);
  const totalFavorites = s.reduce((a, w) => a + (w.favorites ?? 0), 0);
  const featuredCount = s.filter((w) => w.featured).length;
  const trendingCount = s.filter((w) => w.trending).length;
  const edits24h = edits.filter((e) => {
    const t = editTimestampMs(e.editedAt);
    return Date.now() - t < 86400000;
  }).length;

  const statCards = [
    { ...STAT_CARDS_CONFIG[0], value: s.length, sub: `${featuredCount} featured \u00B7 ${trendingCount} trending` },
    { ...STAT_CARDS_CONFIG[1], value: fmtCompact(totalViews), sub: `${s.length > 0 ? Math.round(totalViews / s.length) : 0} avg per wallpaper` },
    { ...STAT_CARDS_CONFIG[2], value: fmtCompact(totalDownloads), sub: `${s.length > 0 ? Math.round(totalDownloads / s.length) : 0} avg per wallpaper` },
    { ...STAT_CARDS_CONFIG[3], value: fmtCompact(totalFavorites), sub: `${s.length > 0 ? Math.round(totalFavorites / s.length) : 0} avg per wallpaper` },
    { ...STAT_CARDS_CONFIG[5], value: drafts.length, sub: drafts.length > 0 ? `${Math.round((drafts.length / Math.max(s.length + drafts.length, 1)) * 100)}% of total` : "All published" },
    { ...STAT_CARDS_CONFIG[6], value: edits24h, sub: `${edits.length} total recorded` },
  ];

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: LayoutDashboard },
    { id: "team" as Tab, label: "Team", icon: Users, count: admins.length + moderators.length },
    { id: "wallpapers" as Tab, label: "Wallpapers", icon: ImageIcon, count: s.length },
    { id: "edits" as Tab, label: "Edits", icon: History, count: edits.length },
    { id: "drafts" as Tab, label: "Drafts", icon: EyeOff, count: drafts.length },
  ];

  return (
    <div className="space-y-8">
      {/* ── Top bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/10">
            <LayoutDashboard size={22} className="text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Signed in as <strong className="text-zinc-300">{user.email}</strong>
              <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium">
                <Shield size={9} /> admin
              </span>
            </p>
          </div>
        </div>
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs text-zinc-500 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <Clock size={11} /> {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-medium rounded-lg transition-all"
            >
              <Layers size={12} />
              Studio CMS
            </Link>
            <Link
              href="/studio/wallpapers/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-all"
            >
              <ImageIcon size={12} />
              New Wallpaper
            </Link>
            <button
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs border border-zinc-700 rounded-lg hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50 text-zinc-300"
              type="button"
            >
              {loading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Refresh
            </button>
          </div>
        </motion.div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* ── Tabs ── */}
      <nav className="flex gap-1 border-b border-zinc-800 pb-px overflow-x-auto" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0 ${
              tab === t.id
                ? "border-primary text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
            }`}
            type="button"
          >
            <t.icon size={14} />
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                tab === t.id ? "bg-primary/10 text-primary" : "bg-zinc-800 text-zinc-500"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* ── Tab content ── */}
      {tab === "overview" && (
        <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="group relative bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all cursor-default">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.glow}`}>
                      <stat.icon size={15} className="text-white" />
                    </div>
                    <Hash size={12} className="text-zinc-600" />
                  </div>
                  <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                  <p className="text-[11px] text-zinc-400 mt-1">{stat.label}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{stat.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs bg-zinc-900/60 border border-zinc-800 hover:border-primary/40 rounded-lg text-zinc-400 hover:text-primary transition-all"
            >
              <BarChart3 size={13} />
              Analytics
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs bg-zinc-900/60 border border-zinc-800 hover:border-primary/40 rounded-lg text-zinc-400 hover:text-primary transition-all"
            >
              <Users size={13} />
              Users
            </Link>
            <Link
              href="/admin/roles"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs bg-zinc-900/60 border border-zinc-800 hover:border-primary/40 rounded-lg text-zinc-400 hover:text-primary transition-all"
            >
              <Shield size={13} />
              Roles
            </Link>
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs bg-zinc-900/60 border border-zinc-800 hover:border-primary/40 rounded-lg text-zinc-400 hover:text-primary transition-all"
            >
              <Settings size={13} />
              Settings
            </Link>
          </div>

          {/* Leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Downloaded */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Download size={14} className="text-violet-400" /> Top Downloaded
                </h3>
              </div>
              {topDownloaded.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">No data yet.</p>
              ) : (
                <div className="space-y-1">
                  {topDownloaded.map((w, i) => (
                    <Link
                      key={w.id}
                      href={`/wallpaper/${w.id}/${createSlug(w.title)}`}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-all group"
                    >
                      <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        i === 0 ? "bg-amber-500/20 text-amber-400" :
                        i === 1 ? "bg-zinc-500/20 text-zinc-400" :
                        i === 2 ? "bg-amber-700/20 text-amber-600" :
                        "text-zinc-600"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="h-11 w-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0 ring-1 ring-zinc-700">
                        <img
                          src={resolveThumbnailUrl(w) ?? `/wallpapers/${w.filename}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-primary transition-colors">{w.title}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{w.slug}</p>
                      </div>
                      <span className="text-xs font-mono text-violet-400 shrink-0 font-medium">
                        {fmtCompact(w.downloads ?? 0)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Top Viewed */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Eye size={14} className="text-blue-400" /> Top Viewed
                </h3>
              </div>
              {topViewed.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">No data yet.</p>
              ) : (
                <div className="space-y-1">
                  {topViewed.map((w, i) => (
                    <Link
                      key={w.id}
                      href={`/wallpaper/${w.id}/${createSlug(w.title)}`}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-all group"
                    >
                      <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        i === 0 ? "bg-amber-500/20 text-amber-400" :
                        i === 1 ? "bg-zinc-500/20 text-zinc-400" :
                        i === 2 ? "bg-amber-700/20 text-amber-600" :
                        "text-zinc-600"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="h-11 w-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0 ring-1 ring-zinc-700">
                        <img
                          src={resolveThumbnailUrl(w) ?? `/wallpapers/${w.filename}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-primary transition-colors">{w.title}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{w.slug}</p>
                      </div>
                      <span className="text-xs font-mono text-blue-400 shrink-0 font-medium">
                        {fmtCompact(w.views ?? 0)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity chart + Category split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BarChart3 size={14} className="text-primary" /> Edit Activity (7 days)
                </h3>
                <span className="text-[10px] text-zinc-500">{edits.length} total edits</span>
              </div>
              {edits.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-28 text-zinc-500">
                  <CheckCircle2 size={20} className="opacity-40" />
                  <p className="text-xs mt-1 opacity-60">No edits recorded.</p>
                </div>
              ) : (
                <ActivityChart edits={edits} />
              )}
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers size={14} className="text-violet-400" /> Category Distribution
                </h3>
              </div>
              <CategorySplit wallpapers={s} />
            </div>
          </div>
        </motion.div>
      )}

      {tab === "team" && <TeamTab data={data} loading={loading} />}
      {tab === "wallpapers" && (
        <WallpapersTab
          wallpapers={filteredWallpapers}
          loading={loading}
          search={search}
          onSearch={setSearch}
        />
      )}
      {tab === "edits" && <EditsTab edits={data?.recentEdits ?? []} loading={loading} />}
      {tab === "drafts" && <DraftsTab drafts={data?.drafts ?? []} loading={loading} />}
    </div>
  );
}

function TeamTab({ data, loading }: { data: OverviewData | null; loading: boolean }) {
  if (loading && !data) {
    return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>;
  }
  if (!data) return null;

  const byId = new Map<string, { user: UserSummary; isAdmin: boolean; isModerator: boolean }>();
  data.admins.forEach((u) =>
    byId.set(u.uid, { user: u, isAdmin: true, isModerator: !!u.roles.moderator })
  );
  data.moderators.forEach((u) => {
    const e = byId.get(u.uid);
    if (e) e.isModerator = true;
    else byId.set(u.uid, { user: u, isAdmin: !!u.roles.admin, isModerator: true });
  });
  const list = Array.from(byId.values()).sort((a, b) =>
    (a.user.displayName || a.user.email || "").localeCompare(b.user.displayName || b.user.email || "")
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
          <Users size={32} className="opacity-40" />
          <p className="text-sm">No team members yet. Run <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-primary">npm run role add email admin moderator</code>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(({ user: u, isAdmin, isModerator }) => (
            <motion.div
              key={u.uid}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="group flex items-center gap-3 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all"
            >
              <Avatar src={u.photoURL} name={u.displayName || u.email || "?"} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-primary transition-colors">{u.displayName || u.email || "Anonymous"}</p>
                <p className="text-xs text-zinc-500 truncate">{u.email}</p>
              </div>
              <div className="flex gap-1.5 flex-wrap shrink-0">
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Shield size={10} /> admin
                  </span>
                )}
                {isModerator && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                    <ShieldCheck size={10} /> mod
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function WallpapersTab({
  wallpapers, loading, search, onSearch,
}: {
  wallpapers: WallpaperMetadata[];
  loading: boolean;
  search: string;
  onSearch: (s: string) => void;
}) {
  const [sortBy, setSortBy] = useState<"title" | "downloads" | "views" | "updated">("updated");

  const sorted = useMemo(() => {
    const list = [...wallpapers];
    switch (sortBy) {
      case "title":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "downloads":
        list.sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0));
        break;
      case "views":
        list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
        break;
      case "updated":
        list.sort((a, b) => {
          const ta = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
          const tb = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
          return tb - ta;
        });
        break;
    }
    return list;
  }, [wallpapers, sortBy]);

  const SORT_BTNS: { value: typeof sortBy; label: string }[] = [
    { value: "updated", label: "Updated" },
    { value: "downloads", label: "Downloads" },
    { value: "views", label: "Views" },
    { value: "title", label: "Title" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg focus-within:border-primary/40 transition-all">
          <Search size={14} className="text-zinc-500 shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by title, slug, category, or tag&hellip;"
            aria-label="Search wallpapers"
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-zinc-600"
          />
        </div>
        <div className="flex gap-1 bg-zinc-900/60 rounded-lg p-1 border border-zinc-800">
          {SORT_BTNS.map((b) => (
            <button
              key={b.value}
              onClick={() => setSortBy(b.value)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                sortBy === b.value
                  ? "bg-primary/10 text-primary font-medium shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              type="button"
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {loading && wallpapers.length === 0 ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
          <ImageIcon size={28} className="opacity-40" />
          <p className="text-sm">{search ? "No wallpapers match this search." : "No wallpapers found."}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sorted.slice(0, 80).map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.008 }}
              >
                <Link
                  href={`/wallpaper/${w.id}/${createSlug(w.title)}`}
                  target="_blank"
                  rel="noopener"
                  className="group flex items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all"
                >
                  <div className="h-16 w-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0 relative ring-1 ring-zinc-700">
                    <img
                      src={resolveThumbnailUrl(w) ?? `/wallpapers/${w.filename}`}
                      alt={w.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {w.featured && (
                      <span className="absolute top-1 left-1 px-1 py-0.5 rounded text-[8px] font-bold bg-primary text-black">F</span>
                    )}
                    {w.trending && (
                      <span className="absolute top-1 right-1 px-1 py-0.5 rounded text-[8px] font-bold bg-blue-500 text-white">
                        <TrendingUp size={8} />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-primary transition-colors">{w.title}</p>
                    <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">{w.slug}</p>
                    <div className="flex items-center gap-2.5 mt-1.5 text-[10px] text-zinc-500">
                      <span className="flex items-center gap-0.5"><Eye size={9} />{fmtCompact(w.views ?? 0)}</span>
                      <span className="flex items-center gap-0.5"><Download size={9} />{fmtCompact(w.downloads ?? 0)}</span>
                      <span className="flex items-center gap-0.5"><Heart size={9} />{fmtCompact(w.favorites ?? 0)}</span>
                    </div>
                  </div>
                  <ExternalLink size={12} className="text-zinc-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </motion.div>
            ))}
          </div>
          {sorted.length > 80 && (
            <p className="text-center text-xs text-zinc-500 py-3">
              Showing first 80 of {sorted.length}. Refine your search.
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}

function DraftsTab({ drafts, loading }: { drafts: WallpaperMetadata[]; loading: boolean }) {
  if (loading && drafts.length === 0) {
    return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>;
  }
  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
        <CheckCircle2 size={28} className="opacity-40" />
        <p className="text-sm">No drafts. Every wallpaper is currently published.</p>
      </div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {drafts.slice(0, 80).map((w, i) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.008 }}
          >
            <Link
              href={`/wallpaper/${w.id}/${createSlug(w.title)}`}
              target="_blank"
              rel="noopener"
              className="group flex items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-amber-500/30 transition-all"
            >
              <div className="h-16 w-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0 relative ring-1 ring-zinc-700">
                <img
                  src={resolveThumbnailUrl(w) ?? `/wallpapers/${w.filename}`}
                  alt={w.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/90 text-black flex items-center gap-0.5">
                  <EyeOff size={8} /> D
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-amber-400 transition-colors">{w.title}</p>
                <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">{w.slug}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5 capitalize">{w.categoryId}</p>
              </div>
              <ExternalLink size={12} className="text-zinc-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </motion.div>
        ))}
      </div>
      {drafts.length > 80 && (
        <p className="text-center text-xs text-zinc-500 py-3">
          Showing first 80 of {drafts.length}.
        </p>
      )}
    </motion.div>
  );
}

function EditsTab({ edits, loading }: { edits: WallpaperEdit[]; loading: boolean }) {
  if (loading && edits.length === 0) {
    return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>;
  }
  if (edits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
        <CheckCircle2 size={28} className="opacity-40" />
        <p className="text-sm">No edits yet. Moderators haven&rsquo;t changed any wallpapers.</p>
      </div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {edits.map((e, i) => {
        const t = (e.editedAt as { toDate?: () => Date })?.toDate?.();
        const fields = Object.keys(e.changes ?? {});
        return (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.015 }}
            className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/wallpaper/${e.after.id ?? e.wallpaperSlug}/${createSlug(e.after.title ?? e.wallpaperSlug)}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 font-mono text-sm font-medium text-zinc-200 hover:text-primary transition-colors"
                  >
                    {e.after.title ?? e.wallpaperSlug} <ExternalLink size={10} />
                  </Link>
                  <span className="text-xs text-zinc-500">
                    by <strong className="text-zinc-300">{e.editedByName || e.editedByEmail || "Unknown"}</strong>
                  </span>
                </div>
                {fields.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {fields.slice(0, 4).map((f) => (
                      <span key={f} className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 font-mono ring-1 ring-zinc-700">
                        {f}
                      </span>
                    ))}
                    {fields.length > 4 && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-500 ring-1 ring-zinc-700">
                        +{fields.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-zinc-400 block">
                  <RelativeTime date={t} />
                </span>
                <span className="text-[10px] text-zinc-600">
                  {t?.toLocaleDateString()}
                </span>
              </div>
            </div>
            {Object.entries(e.changes ?? {}).slice(0, 2).map(([field, diff]) => (
              <div key={field} className="mt-2.5 text-xs text-zinc-400 bg-zinc-800/50 rounded-lg p-2.5 font-mono leading-relaxed border border-zinc-700/50">
                <span className="text-primary font-medium">{field}</span>:
                <span className="text-rose-400"> {String(diff.from ?? "\u2014")}</span>
                {" \u2192 "}
                <span className="text-emerald-400">{String(diff.to ?? "\u2014")}</span>
              </div>
            ))}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
