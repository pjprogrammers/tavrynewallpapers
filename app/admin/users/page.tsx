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
  const { roles, loading: rolesLoading } = useUserRoles();
  const [admins, setAdmins] = useState<UserSummary[]>([]);
  const [moderators, setModerators] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const isAdmin = roles.admin === true;

  const fetch = useCallback(async () => {
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
    if (!authLoading && !rolesLoading && isAdmin) fetch();
  }, [authLoading, rolesLoading, isAdmin, fetch]);

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin"
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all">
          <ArrowLeft size={20} />
        </Link>
        <Users size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <span className="text-xs text-zinc-500">{byId.size} users</span>
      </div>

      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg focus-within:border-primary/40 mb-6">
        <Search size={14} className="text-zinc-500 shrink-0" />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-zinc-600" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ user: u, isAdmin, isModerator }) => (
            <div key={u.uid}
              className="flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/80 to-primary/30 flex items-center justify-center text-white font-bold shrink-0 ring-1 ring-white/10 text-sm">
                {(u.displayName || u.email || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-200 truncate">{u.displayName || "Anonymous"}</p>
                <p className="text-xs text-zinc-500 truncate">{u.email}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
