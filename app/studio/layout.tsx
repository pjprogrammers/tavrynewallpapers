"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ImageIcon,
  PlusCircle,
  Shield,
  ShieldCheck,
  AlertTriangle,
  EyeOff,
  Sparkles,
  Trash2,
  Upload,
  RefreshCw,
  Database,
  Layers,
  Tag,
  Activity,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import Header from "../components/Header";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/studio/wallpapers", label: "Wallpapers", icon: ImageIcon },
  { href: "/studio/wallpapers/new", label: "New", icon: PlusCircle },
  { href: "/studio/wallpapers/bulk-import", label: "Bulk Import", icon: Upload },
  { href: "/studio/drafts", label: "Drafts", icon: EyeOff },
  { href: "/studio/categories", label: "Categories", icon: Layers },
  { href: "/studio/tags", label: "Tags", icon: Tag },
  { href: "/studio/featured", label: "Featured", icon: Sparkles },
  { href: "/studio/deleted", label: "Trash", icon: Trash2 },
  { href: "/studio/tools/recalculate", label: "Recalculate", icon: RefreshCw },
  { href: "/studio/export", label: "Export", icon: Database },
  { href: "/studio/health", label: "Health", icon: Activity },
];

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoading = authLoading || rolesLoading;
  const canAccess = user && hasPermission(user, "wallpaper.create", roles);
  const isModerator = roles.moderator === true;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
            <Loader2 size={36} className="animate-spin text-amber-500 relative" />
          </div>
          <p className="text-sm text-zinc-400">Checking access&hellip;</p>
        </div>
      </div>
    );
  }

  if (!user || !canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-5 p-10 rounded-2xl bg-zinc-900/50 border border-zinc-800 max-w-md text-center backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full" />
            <AlertTriangle size={52} className="text-amber-400 relative" />
          </div>
          <h1 className="text-xl font-bold text-white">Access Denied</h1>
          <p className="text-sm text-zinc-400">
            You need the moderator or admin role to access the studio.
          </p>
          {user && isModerator && (
            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-blue-400" />
              You have moderator role but lack the <code className="px-1 bg-zinc-800 rounded text-xs">wallpaper.create</code> permission.
            </p>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-zinc-700 rounded-lg hover:border-amber-500/40 transition-all text-sm text-zinc-300 hover:text-white"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      {/* Studio top bar */}
      <header className="sticky top-[70px] z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link
              href="/studio"
              className="flex items-center gap-2 font-semibold text-zinc-100 hover:text-amber-400 transition-colors shrink-0"
            >
              <Shield size={18} className="text-amber-500" />
              <span>Studio</span>
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="sm:hidden p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <nav className="hidden sm:flex items-center gap-0.5 overflow-x-auto hide-scrollbar">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-all ${
                      active
                        ? "bg-amber-500/10 text-amber-400 font-medium"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    }`}
                  >
                    <item.icon size={13} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-zinc-500 hidden lg:block">
              {user?.email ?? ""}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
              <ShieldCheck size={10} />
              {roles.admin ? "admin" : "moderator"}
            </span>
          </div>
        </div>
      </header>
      <main className="pt-[126px]">{children}</main>

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] sm:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-800 p-4 pt-16 overflow-y-auto">
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-all ${
                      active
                        ? "bg-amber-500/10 text-amber-400 font-medium"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
