"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  ArrowLeft,
  Info,
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
  const { roles, loading: rolesLoading } = useUserRoles();

  const isAdmin = roles.admin === true;

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
          <div className="flex items-start gap-3">
            <Info size={18} className="text-zinc-400 shrink-0 mt-0.5" />
            <div className="text-sm text-zinc-400">
              <p className="mb-2">
                Roles are managed via the CLI: <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-amber-400">npm run role add &lt;email&gt; admin moderator</code>
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
