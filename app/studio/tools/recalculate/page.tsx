"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import {
  getAllWallpapersForStudio,
} from "@/lib/wallpaper-store";
import { recalculateWallpapers, type RecalculateResult } from "@/lib/recalculate";

function parseIdList(input: string): number[] {
  const ids: number[] = [];
  for (const part of input.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const num = Number(trimmed);
    if (!isNaN(num) && num > 0) ids.push(num);
  }
  return ids.sort((a, b) => a - b);
}

export default function RecalculatePage() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [specificIds, setSpecificIds] = useState("");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<RecalculateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  const canEdit = user && hasPermission(user, "wallpaper.edit", roles);

  const handleRecalculate = useCallback(
    async (mode: "all" | "range") => {
      if (!user) return;
      setProcessing(true);
      setError(null);
      setResults(null);

      try {
        const all = await getAllWallpapersForStudio(1000);
        let filtered = all.filter((w) => !w.deleted);

        if (mode === "range") {
          const parsed = specificIds.trim()
            ? parseIdList(specificIds)
            : [];

          if (parsed.length > 0) {
            const idSet = new Set(parsed.map(String));
            filtered = filtered.filter((w) => idSet.has(w.id));
          } else {
            const start = fromId ? parseInt(fromId, 10) : NaN;
            const end = toId ? parseInt(toId, 10) : NaN;
            if (isNaN(start) && isNaN(end)) {
              setError("Enter an ID range (From–To) or a list of specific IDs");
              setProcessing(false);
              return;
            }
            filtered = filtered.filter((w) => {
              const nid = parseInt(w.id, 10);
              if (isNaN(nid)) return false;
              if (!isNaN(start) && nid < start) return false;
              if (!isNaN(end) && nid > end) return false;
              return true;
            });
          }

          if (filtered.length === 0) {
            setError("No wallpapers found matching the specified IDs");
            setProcessing(false);
            return;
          }
        }

        setProcessingStatus(`Processing ${filtered.length} wallpaper${filtered.length === 1 ? "" : "s"}...`);

        const result = await recalculateWallpapers(filtered);
        setResults(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setProcessing(false);
        setProcessingStatus(null);
      }
    },
    [user, fromId, toId, specificIds]
  );

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

      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <p className="text-sm text-zinc-300 font-medium mb-2">What this does</p>
          <ul className="text-xs text-zinc-400 space-y-1">
            <li>• <strong>Orientation</strong> &mdash; landscape / portrait / square from width &times; height</li>
            <li>• <strong>Aspect Ratio</strong> &mdash; e.g. 16:9 from GCD of width &times; height</li>
            <li>• <strong>Resolution Tag</strong> &mdash; e.g. 4K, HD &mdash; updated in wallpaper tags</li>
            <li>• Only wallpapers with valid width &times; height are updated</li>
          </ul>
        </div>

        {/* ID Range Input */}
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <p className="text-sm text-zinc-300 font-medium mb-3">Filter by ID Range</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 mb-1">From ID</label>
              <input
                type="number"
                min={1}
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                placeholder="e.g. 1"
                disabled={processing}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm"
              />
            </div>
            <span className="text-zinc-600 mt-5">&ndash;</span>
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 mb-1">To ID</label>
              <input
                type="number"
                min={1}
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                placeholder="e.g. 100"
                disabled={processing}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm"
              />
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-zinc-900/50 px-2 text-zinc-600">or</span>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-zinc-500 mb-1">Specific IDs (comma-separated)</label>
            <textarea
              value={specificIds}
              onChange={(e) => setSpecificIds(e.target.value)}
              placeholder="1, 5, 12, 45, 100"
              rows={2}
              disabled={processing}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm resize-none"
            />
          </div>
        </div>

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
              <span className="text-zinc-200">
                Updated {results.updated} wallpaper{results.updated === 1 ? "" : "s"}
                {results.skipped > 0 && (
                  <span className="text-zinc-500 ml-2">
                    ({results.skipped} skipped)
                  </span>
                )}
              </span>
            </div>
            {results.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {results.errors.map((err, i) => (
                  <div key={i} className="text-xs text-red-400">{err}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {processingStatus && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 size={14} className="animate-spin text-amber-400" />
            {processingStatus}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => handleRecalculate("range")}
            disabled={processing || (!fromId && !toId && !specificIds.trim())}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            {processing ? (
              <><Loader2 size={18} className="animate-spin" /> Processing&hellip;</>
            ) : (
              <><RefreshCw size={18} /> Recalculate Range</>
            )}
          </button>
          <button
            onClick={() => handleRecalculate("all")}
            disabled={processing}
            className="flex-1 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-200 font-medium transition-all flex items-center justify-center gap-2"
          >
            {processing ? (
              <><Loader2 size={18} className="animate-spin" /> Processing&hellip;</>
            ) : (
              <><RefreshCw size={18} /> Recalculate All</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
