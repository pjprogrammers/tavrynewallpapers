"use client";

import Link from "next/link";
import {
  Settings,
  ArrowLeft,
  Info,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";

export default function AdminSettingsPage() {
  const { loading: authLoading } = useAuth();
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin"
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all">
          <ArrowLeft size={20} />
        </Link>
        <Settings size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="space-y-4">
        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-zinc-400 shrink-0 mt-0.5" />
            <div className="text-sm text-zinc-400">
              <p className="mb-3">
                Site-wide settings are currently managed through environment variables
                and Firebase configuration.
              </p>
              <ul className="space-y-2">
                <li>
                  <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-amber-400">NEXT_PUBLIC_SITE_URL</code>
                  {" — "}Canonical site URL used for SEO and sitemaps.
                </li>
                <li>
                  <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-amber-400">Firebase Security Rules</code>
                  {" — "}Manage via{" "}
                  <a href="https://console.firebase.google.com" target="_blank" rel="noopener"
                    className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-0.5">
                    Firebase Console <ExternalLink size={10} />
                  </a>
                </li>
                <li>
                  <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-amber-400">Firestore Indexes</code>
                  {" — "}Defined in <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs">firestore.indexes.json</code>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800">
          <h2 className="text-sm font-semibold text-white mb-3">Environment</h2>
          <div className="space-y-2 text-sm">
            {[
              ["NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL || "Not set"],
              ["NEXT_PUBLIC_FIREBASE_PROJECT", process.env.NEXT_PUBLIC_FIREBASE_PROJECT || "Not set"],
              ["Node", process.version],
            ].map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <code className="text-xs text-zinc-500">{key}</code>
                <span className="text-xs text-zinc-300 font-mono">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
