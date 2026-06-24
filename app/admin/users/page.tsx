"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  Shield,
  ShieldCheck,
  Users,
  ArrowLeft,
  RefreshCw,
  Ban,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { getAdminsFromFirestore, getModeratorsFromFirestore, type UserSummary } from "@/lib/users";

function fmtDate(d: unknown): string {
  if (!d) return "—";
  if (typeof d === "object" && "toDate" in (d as object)) return (d as { toDate: () => Date }).toDate().toLocaleDateString();
  if (d instanceof Date) return d.toLocaleDateString();
  return String(d);
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading, refreshToken } = useUserRoles();
  const [admins, setAdmins] = useState<UserSummary[]>([]);
  const [moderators, setModerators] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ email: string; type: "success" | "error"; message: string } | null>(null);

  const isAdmin = roles.admin === true;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const [a, m] = await Promise.all([
      getAdminsFromFirestore(200),
      getModeratorsFromFirestore(200),
    ]);
    setAdmins(a);
    setModerators(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !rolesLoading && isAdmin) loadUsers();
  }, [authLoading, rolesLoading, isAdmin, loadUsers]);

  const byId = useMemo(() => {
    const map = new Map<string, { user: UserSummary; isAdmin: boolean; isModerator: boolean }>();
    admins.forEach((u) => map.set(u.uid, { user: u, isAdmin: true, isModerator: !!u.roles?.moderator }));
    moderators.forEach((u) => {
      const e = map.get(u.uid);
      if (e) e.isModerator = true;
      else map.set(u.uid, { user: u, isAdmin: !!u.roles?.admin, isModerator: true });
    });
    return map;
  }, [admins, moderators]);

  const filtered = useMemo(() => {
    const list = Array.from(byId.values());
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(
      (e) =>
        (e.user.displayName ?? "").toLowerCase().includes(s) ||
        (e.user.email ?? "").toLowerCase().includes(s)
    );
  }, [byId, search]);

  const handleDeactivate = useCallback(async (email: string, currentlyActive: boolean) => {
    if (!user) return;
    const targetIsActive = !currentlyActive;
    setActionStatus(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/users/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, isActive: targetIsActive }),
      });
      const data = await res.json();

      if (res.ok) {
        setActionStatus({ email, type: "success", message: `${email} ${targetIsActive ? "reactivated" : "deactivated"}.` });
        loadUsers();
      } else {
        setActionStatus({ email, type: "error", message: data.error || "Request failed." });
      }
    } catch {
      setActionStatus({ email, type: "error", message: "Network error." });
    }
  }, [user, loadUsers]);

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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin"
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all">
            <ArrowLeft size={20} />
          </Link>
          <Users size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-white">Users</h1>
        </div>
        <button
          onClick={async () => {
            setRefreshBusy(true);
            await refreshToken();
            setRefreshBusy(false);
          }}
          disabled={refreshBusy}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshBusy ? "animate-spin" : ""} />
          Refresh claims
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {actionStatus && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${actionStatus.type === "success" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
          {actionStatus.type === "success" ? <CheckCircle size={16} /> : <Ban size={16} />}
          {actionStatus.message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-zinc-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          {search ? "No users match your search." : "No users found."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(({ user: u, isAdmin: uIsAdmin, isModerator: uIsMod }) => (
            <div
              key={u.uid}
              className="flex items-center gap-4 px-4 py-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-800/30 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium text-zinc-300 shrink-0">
                {(u.displayName?.[0] || u.email?.[0] || "?").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{u.displayName || "—"}</p>
                <p className="text-xs text-zinc-500 truncate">{u.email || "—"}</p>
                <p className="text-xs text-zinc-600">Joined {fmtDate(u.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {uIsAdmin && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                    <Shield size={12} /> admin
                  </span>
                )}
                {uIsMod && !uIsAdmin && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-medium">
                    <ShieldCheck size={12} /> mod
                  </span>
                )}
                {!uIsAdmin && !uIsMod && (
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 text-xs">user</span>
                )}
                {u.email && (
                  <button
                    onClick={() => handleDeactivate(u.email!, u.isActive !== false)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all ${
                      u.isActive === false
                        ? "bg-green-900/30 text-green-400 hover:bg-green-900/50"
                        : "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                    }`}
                    title={u.isActive === false ? "Reactivate user" : "Deactivate user"}
                  >
                    {u.isActive === false ? <CheckCircle size={12} /> : <Ban size={12} />}
                    {u.isActive === false ? "reactivate" : "deactivate"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
