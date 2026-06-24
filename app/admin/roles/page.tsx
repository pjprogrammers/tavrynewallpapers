"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  ArrowLeft,
  Info,
  RefreshCw,
  UserPlus,
  UserX,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { AllPermissions, type Permission } from "@/lib/roles";

const ROLE_INFO = [
  {
    role: "admin",
    icon: Shield,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "ring-primary/20",
    description: "Full access to all features including user/role management.",
    permissions: Object.keys(AllPermissions) as Permission[],
  },
  {
    role: "moderator",
    icon: ShieldCheck,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "ring-blue-500/20",
    description: "Can create and edit wallpapers. Cannot manage users, roles, or settings.",
    permissions: ["wallpaper.create", "wallpaper.edit"],
  },
] as const;

export default function AdminRolesPage() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading, refreshToken } = useUserRoles();

  const isAdmin = roles.admin === true;

  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [action, setAction] = useState<"add" | "remove" | "set">("add");
  const [status, setStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });
  const [busy, setBusy] = useState(false);

  const toggleRole = useCallback((role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!email.trim() || selectedRoles.length === 0) return;
    setBusy(true);
    setStatus({ type: "", message: "" });

    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, email: email.trim(), roles: selectedRoles }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus({
          type: "success",
          message: `Roles updated for ${email}: ${data.currentRoles?.join(", ") || "none"}`,
        });
        await refreshToken();
      } else {
        setStatus({ type: "error", message: data.error || "Request failed." });
      }
    } catch {
      setStatus({ type: "error", message: "Network error." });
    } finally {
      setBusy(false);
    }
  }, [email, selectedRoles, action, user, refreshToken]);

  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin"
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all">
          <ArrowLeft size={20} />
        </Link>
        <Shield size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-white">Role Definitions</h1>
      </div>

      <div className="space-y-6">
        {ROLE_INFO.map(({ role, icon: Icon, color, bg, border, description, permissions }) => (
          <div key={role} className={`p-5 rounded-xl ${bg} border ${border}`}>
            <div className="flex items-center gap-3 mb-3">
              <Icon size={20} className={color} />
              <h2 className="text-lg font-semibold text-white capitalize">{role}</h2>
            </div>
            <p className="text-sm text-zinc-400 mb-4">{description}</p>
            <div className="flex flex-wrap gap-2">
              {permissions.map((p) => (
                <span key={p} className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-mono">
                  {p}
                </span>
              ))}
            </div>
          </div>
        ))}

        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={18} className="text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Manage Roles</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Action</label>
              <div className="flex gap-2">
                {(["add", "set", "remove"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAction(a)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      action === a
                        ? "bg-primary/20 text-primary ring-1 ring-primary"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {a === "add" ? "Add" : a === "set" ? "Set" : "Remove"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Roles</label>
              <div className="flex gap-2">
                {["admin", "moderator"].map((role) => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                      selectedRoles.includes(role)
                        ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={busy || !email.trim() || selectedRoles.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium transition-all"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {action === "add" ? "Add Roles" : action === "remove" ? "Remove Roles" : "Set Roles"}
            </button>

            {status.message && (
              <div className={`flex items-center gap-2 text-sm ${status.type === "success" ? "text-green-400" : "text-red-400"}`}>
                {status.type === "success" ? "✓" : "✗"} {status.message}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-zinc-400 shrink-0 mt-0.5" />
            <div className="text-sm text-zinc-400 space-y-2">
              <p>
                Roles are also manageable via the CLI: <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-amber-400">npm run role add &lt;email&gt; admin moderator</code>
              </p>
              <p>
                After a role change, click <button onClick={refreshToken} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-amber-400 hover:text-amber-300 text-xs">
                  <RefreshCw size={12} /> Refresh claims
                </button> to force an ID-token refresh without signing out.
              </p>
              <p>
                The <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-amber-400">hasPermission()</code> helper in{" "}
                <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-amber-400">lib/roles.ts</code> determines
                access at the component level. Admins inherit all permissions; moderators
                get content permissions only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
