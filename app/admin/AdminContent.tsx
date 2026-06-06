"use client";

/**
 * 🛡️ AdminContent
 * ================
 *
 * Client-side admin dashboard. Checks the current user's roles and
 * shows:
 *   1. Team overview (admins + moderators)
 *   2. Wallpaper inventory (with edit counts)
 *   3. Recent edits
 *
 * If the user is not an admin, it shows an "Access denied" screen
 * with a friendly message. All data is fetched client-side from
 * Firestore (security rules enforce that only admins can read user
 * docs with roles).
 *
 * NOTE: All styles live in `app/globals.css` to avoid the
 * styled-jsx "nested tag" build error.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
  ChevronRight,
  Search,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { getAllWallpapersFromFirestore, getRecentEditsFromFirestore } from "@/lib/wallpaper-store";
import {
  getAdminsFromFirestore,
  getModeratorsFromFirestore,
  type UserSummary,
} from "@/lib/users";
import type { WallpaperMetadata, WallpaperEdit } from "@/lib/firestore-types";

type Tab = "overview" | "team" | "wallpapers" | "edits";

interface OverviewData {
  admins: UserSummary[];
  moderators: UserSummary[];
  wallpapers: WallpaperMetadata[];
  recentEdits: WallpaperEdit[];
}

export default function AdminContent() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const isAdmin = roles.admin === true;
  const isModerator = roles.moderator === true;

  const refresh = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const [admins, moderators, wallpapers, recentEdits] = await Promise.all([
        getAdminsFromFirestore(200),
        getModeratorsFromFirestore(200),
        getAllWallpapersFromFirestore(500),
        getRecentEditsFromFirestore(30),
      ]);
      setData({ admins, moderators, wallpapers, recentEdits });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      refresh();
    }
  }, [isAdmin, refresh]);

  if (authLoading || rolesLoading) {
    return (
      <div className="admin-loading">
        <Loader2 size={32} className="animate-spin" />
        <p>Checking access…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-denied">
        <Shield size={48} />
        <h1>Sign in required</h1>
        <p>You must be signed in to access the admin dashboard.</p>
        <div className="admin-denied-actions">
          <Link
            href={`/login?redirect=${encodeURIComponent("/admin")}`}
            className="admin-cta"
          >
            Sign in <ChevronRight size={16} />
          </Link>
          <Link href="/" className="admin-cta-secondary">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <AlertTriangle size={48} />
        <h1>Access denied</h1>
        <p>
          You are signed in as <strong>{user.email}</strong>, but your account does
          not have the <code>admin</code> role.
        </p>
        {isModerator && (
          <p className="admin-note">
            <ShieldCheck size={14} /> You have the <code>moderator</code> role. You can
            edit any wallpaper from its detail page (look for the pencil icon).
          </p>
        )}
        <p className="admin-foot">
          If you believe this is a mistake, ask an existing admin to run
          <br />
          <code>npm run role add {user.email} admin</code>
        </p>
        <div className="admin-denied-actions">
          <Link href="/" className="admin-cta-secondary">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const filteredWallpapers = (data?.wallpapers ?? []).filter((w) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      w.title.toLowerCase().includes(s) ||
      w.slug.toLowerCase().includes(s) ||
      w.categoryId.toLowerCase().includes(s) ||
      (w.tags ?? []).some((t) => t.toLowerCase().includes(s))
    );
  });

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h1>
            <Shield size={28} />
            Admin Dashboard
          </h1>
          <p className="admin-sub">
            Signed in as <strong>{user.email}</strong>
            {isModerator && (
              <span className="admin-badge">
                <ShieldCheck size={12} /> admin + moderator
              </span>
            )}
          </p>
        </div>
        <button
          className="admin-refresh"
          onClick={refresh}
          disabled={loading}
          type="button"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="admin-alert admin-alert-error" role="alert">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <nav className="admin-tabs" role="tablist">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={<Shield size={14} />}>
          Overview
        </TabButton>
        <TabButton active={tab === "team"} onClick={() => setTab("team")} icon={<Users size={14} />}>
          Team ({data?.admins.length ?? 0} admins, {data?.moderators.length ?? 0} moderators)
        </TabButton>
        <TabButton active={tab === "wallpapers"} onClick={() => setTab("wallpapers")} icon={<ImageIcon size={14} />}>
          Wallpapers ({data?.wallpapers.length ?? 0})
        </TabButton>
        <TabButton active={tab === "edits"} onClick={() => setTab("edits")} icon={<History size={14} />}>
          Recent edits ({data?.recentEdits.length ?? 0})
        </TabButton>
      </nav>

      {tab === "overview" && <OverviewTab data={data} loading={loading} />}
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
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`admin-tab ${active ? "active" : ""}`}
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}

function OverviewTab({ data, loading }: { data: OverviewData | null; loading: boolean }) {
  if (loading && !data) {
    return (
      <div className="admin-loading">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }
  if (!data) return null;
  const last24h = data.recentEdits.filter((e) => {
    const t = (e.editedAt as { toDate?: () => Date })?.toDate?.();
    if (!t) return false;
    return Date.now() - t.getTime() < 24 * 60 * 60 * 1000;
  });
  return (
    <div className="overview-grid">
      <StatCard label="Admins" value={data.admins.length} icon={<Shield size={20} />} />
      <StatCard label="Moderators" value={data.moderators.length} icon={<ShieldCheck size={20} />} />
      <StatCard label="Total wallpapers" value={data.wallpapers.length} icon={<ImageIcon size={20} />} />
      <StatCard label="Edits (24h)" value={last24h.length} icon={<History size={20} />} accent />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`stat-card ${accent ? "accent" : ""}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function TeamTab({ data, loading }: { data: OverviewData | null; loading: boolean }) {
  if (loading && !data) {
    return <div className="admin-loading"><Loader2 size={24} className="animate-spin" /></div>;
  }
  if (!data) return null;
  const byId = new Map<string, { user: UserSummary; isAdmin: boolean; isModerator: boolean }>();
  data.admins.forEach((u) => byId.set(u.uid, { user: u, isAdmin: true, isModerator: !!u.roles.moderator }));
  data.moderators.forEach((u) => {
    const e = byId.get(u.uid);
    if (e) e.isModerator = true;
    else byId.set(u.uid, { user: u, isAdmin: !!u.roles.admin, isModerator: true });
  });
  const list = Array.from(byId.values()).sort((a, b) =>
    (a.user.displayName || a.user.email || "").localeCompare(b.user.displayName || b.user.email || "")
  );

  return (
    <div className="team-list">
      {list.length === 0 && <p className="empty">No team members yet. Run <code>npm run role add email admin moderator</code>.</p>}
      {list.map(({ user: u, isAdmin, isModerator }) => (
        <div key={u.uid} className="team-row">
          <Image
            src={u.photoURL || "/avatars_preset/aiden.svg"}
            alt=""
            width={40}
            height={40}
            className="team-avatar"
          />
          <div className="team-info">
            <div className="team-name">{u.displayName || u.email || "Anonymous"}</div>
            <div className="team-email">{u.email}</div>
          </div>
          <div className="team-roles">
            {isAdmin && (
              <span className="role-badge admin">
                <Shield size={11} /> admin
              </span>
            )}
            {isModerator && (
              <span className="role-badge moderator">
                <ShieldCheck size={11} /> moderator
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function WallpapersTab({
  wallpapers,
  loading,
  search,
  onSearch,
}: {
  wallpapers: WallpaperMetadata[];
  loading: boolean;
  search: string;
  onSearch: (s: string) => void;
}) {
  return (
    <div className="wallpapers-tab">
      <div className="wallpapers-search">
        <Search size={16} />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by title, slug, category, or tag…"
          className="wallpapers-search-input"
        />
        {search && (
          <span className="wallpapers-count">
            {wallpapers.length} match{wallpapers.length === 1 ? "" : "es"}
          </span>
        )}
      </div>

      {loading && !wallpapers.length ? (
        <div className="admin-loading">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : (
        <div className="wallpapers-grid">
          {wallpapers.slice(0, 100).map((w) => (
            <Link
              key={w.slug}
              href={`/wallpaper/${w.slug}`}
              className="wp-card"
              target="_blank"
              rel="noopener"
            >
              <div className="wp-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/wallpapers/${w.filename}`} alt={w.title} loading="lazy" />
                {w.featured && <span className="wp-badge">Featured</span>}
                {w.trending && <span className="wp-badge trending">Trending</span>}
              </div>
              <div className="wp-meta">
                <div className="wp-title">{w.title}</div>
                <div className="wp-info">
                  <code className="wp-slug">{w.slug}</code>
                  <span className="wp-cat">{w.categoryId}</span>
                </div>
              </div>
              <ExternalLink size={14} className="wp-link-icon" />
            </Link>
          ))}
          {wallpapers.length > 100 && (
            <p className="wallpapers-more">
              Showing first 100 of {wallpapers.length}. Refine your search.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function EditsTab({ edits, loading }: { edits: WallpaperEdit[]; loading: boolean }) {
  if (loading && edits.length === 0) {
    return <div className="admin-loading"><Loader2 size={24} className="animate-spin" /></div>;
  }
  if (edits.length === 0) {
    return (
      <div className="empty-state">
        <CheckCircle2 size={32} />
        <p>No edits yet. Moderators haven&rsquo;t changed any wallpapers.</p>
      </div>
    );
  }
  return (
    <ol className="edits-list">
      {edits.map((e) => {
        const t = (e.editedAt as { toDate?: () => Date })?.toDate?.();
        return (
          <li key={e.id} className="edit-row">
            <div className="edit-head">
              <Link href={`/wallpaper/${e.wallpaperSlug}`} className="edit-wallpaper" target="_blank" rel="noopener">
                {e.wallpaperSlug} <ExternalLink size={12} />
              </Link>
              <span className="edit-when">{t ? t.toLocaleString() : ""}</span>
            </div>
            <div className="edit-by">
              by <strong>{e.editedByName || e.editedByEmail || "Unknown"}</strong>
            </div>
            <ul className="edit-changes">
              {Object.entries(e.changes).map(([field, diff]) => (
                <li key={field}>
                  <code>{field}</code>:{" "}
                  <span className="from">{String(diff.from ?? "—")}</span> →{" "}
                  <span className="to">{String(diff.to ?? "—")}</span>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
