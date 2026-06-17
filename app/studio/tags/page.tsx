"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Loader2, Plus, Pencil, Trash2, Merge, Tag, AlertCircle, X, Search, ArrowRight, List, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import {
  listTags,
  addTag,
  updateTag,
  deleteTag,
  renameTag,
  mergeTags,
  getAllTagCounts,
} from "@/lib/tag-store";
import type { TagDoc } from "@/lib/firestore-types";

export default function StudioTagsPage() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [tags, setTags] = useState<TagDoc[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [merging, setMerging] = useState(false);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameOldId, setRenameOldId] = useState("");
  const [renameNewId, setRenameNewId] = useState("");
  const [renameNewName, setRenameNewName] = useState("");

  const [bulkMode, setBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResults, setBulkResults] = useState<string[] | null>(null);

  const canEdit = user && hasPermission(user, "wallpaper.edit", roles);

  const load = useCallback(async () => {
    setLoading(true);
    const [t, cnts] = await Promise.all([
      listTags(),
      getAllTagCounts().catch(() => ({})),
    ]);
    setTags(t);
    setCounts(cnts);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !rolesLoading && canEdit) load();
  }, [authLoading, rolesLoading, canEdit, load]);

  const handleAdd = async () => {
    if (!addName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const id = addName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      if (!id) { setError("Invalid tag name."); return; }
      await addTag(addName.trim());
      setShowAdd(false);
      setAddName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add tag");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateTag(editId, { name: editName.trim() });
      setEditId(null);
      setEditName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update tag");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete tag "${id}"? This does NOT remove it from wallpapers.`)) return;
    try {
      await deleteTag(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete tag");
    }
  };

  const handleBulkAdd = async () => {
    const names = bulkInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (names.length === 0) return;
    setSaving(true);
    setError(null);
    const created: string[] = [];
    for (const name of names) {
      try {
        const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        if (!id) continue;
        await addTag(name);
        created.push(name);
      } catch (e) {
        // skip duplicates silently
      }
    }
    setBulkInput("");
    setBulkResults(created);
    setBulkMode(false);
    await load();
  };

  const handleRename = async () => {
    if (!renameOldId || !renameNewId.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await renameTag(
        renameOldId,
        renameNewId.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        renameNewName.trim() || undefined,
      );
      setRenameOpen(false);
      setRenameOldId("");
      setRenameNewId("");
      setRenameNewName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to rename tag");
    } finally {
      setSaving(false);
    }
  };

  const handleMerge = async () => {
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) return;
    if (!confirm(`Merge "${mergeSource}" → "${mergeTarget}"? All wallpapers with "${mergeSource}" will be updated.`)) return;
    setMerging(true);
    setError(null);
    try {
      await mergeTags(mergeSource, mergeTarget);
      setMergeOpen(false);
      setMergeSource("");
      setMergeTarget("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to merge tags");
    } finally {
      setMerging(false);
    }
  };

  const startRename = (tag: TagDoc) => {
    setRenameOpen(true);
    setRenameOldId(tag.id);
    setRenameNewId(tag.id);
    setRenameNewName(tag.name);
  };

  const filtered = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.id.includes(search.toLowerCase()),
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
        <AlertCircle size={48} className="text-red-400" />
        <h2 className="text-xl font-semibold text-zinc-300">Access Denied</h2>
        <Link href="/studio" className="text-amber-500 hover:text-amber-400 underline">Back to Studio</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Tag size={24} className="text-amber-500" />
          <h1 className="text-2xl font-bold text-zinc-100">Tags</h1>
          <span className="text-sm text-zinc-500">({tags.length})</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setBulkMode(true); setBulkInput(""); setBulkResults(null); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all"
          >
            <List size={16} /> Bulk Add
          </button>
          <button
            onClick={() => setMergeOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all"
          >
            <Merge size={16} /> Merge Tags
          </button>
          <button
            onClick={() => { setShowAdd(true); setAddName(""); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-all"
          >
            <Plus size={16} /> Add Tag
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-800/50 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-200"><X size={16} /></button>
        </div>
      )}

      {showAdd && (
        <div className="mb-8 p-6 rounded-xl bg-zinc-900/70 border border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-200 mb-4">Add Tag</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="e.g. Cyberpunk"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <p className="text-[11px] text-zinc-500 mt-1">ID will be auto-generated: lowercase, hyphens for spaces.</p>
            </div>
            <button
              onClick={handleAdd}
              disabled={saving || !addName.trim()}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-all"
            >
              {saving ? "Saving..." : "Create"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {renameOpen && (
        <div className="mb-8 p-6 rounded-xl bg-zinc-900/70 border border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-200 mb-4">Rename Tag</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Current ID</label>
              <input type="text" value={renameOldId} disabled className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">New ID (slug)</label>
              <input type="text" value={renameNewId} onChange={(e) => setRenameNewId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">New Display Name</label>
              <input type="text" value={renameNewName} onChange={(e) => setRenameNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleRename} disabled={saving || !renameNewId.trim()}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-all">
                {saving ? "Saving..." : "Rename"}
              </button>
              <button onClick={() => { setRenameOpen(false); }} className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {mergeOpen && (
        <div className="mb-8 p-6 rounded-xl bg-zinc-900/70 border border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
            <Merge size={18} /> Merge Tags
          </h3>
          <p className="text-sm text-zinc-500 mb-4">
            Merge all wallpapers from one tag into another. The source tag will be deleted.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Source (will be merged FROM)</label>
              <select value={mergeSource} onChange={(e) => setMergeSource(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                <option value="">Select source tag…</option>
                {tags.filter((t) => t.id !== mergeTarget).map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.id}) — {counts[t.id] ?? 0}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Target (will receive wallpapers)</label>
              <select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                <option value="">Select target tag…</option>
                {tags.filter((t) => t.id !== mergeSource).map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.id}) — {counts[t.id] ?? 0}</option>
                ))}
              </select>
            </div>
          </div>
          {mergeSource && mergeTarget && mergeSource !== mergeTarget && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-zinc-400">{counts[mergeSource] ?? 0} wallpapers will move</span>
              <ArrowRight size={16} className="text-zinc-500" />
              <button onClick={handleMerge} disabled={merging}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 text-white text-sm font-medium transition-all">
                {merging ? "Merging..." : `Merge into "${mergeTarget}"`}
              </button>
              <button onClick={() => setMergeOpen(false)} className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all">Cancel</button>
            </div>
          )}
        </div>
      )}

      {bulkMode && (
        <div className="mb-8 p-6 rounded-xl bg-zinc-900/70 border border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">Bulk Add Tags</h3>
          <p className="text-sm text-zinc-500 mb-4">Enter tag names separated by commas. IDs will be auto-generated.</p>
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            rows={4}
            placeholder="4K, HDR, Minimalist, Dark, Neon"
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-4"
          />
          <div className="flex gap-3">
            <button onClick={handleBulkAdd} disabled={saving || !bulkInput.trim()}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-all">
              {saving ? "Creating..." : `Create ${bulkInput.split(",").filter(Boolean).length} tags`}
            </button>
            <button onClick={() => { setBulkMode(false); setBulkResults(null); }}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {bulkResults && bulkResults.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-900/30 border border-emerald-800/50 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-emerald-200 text-sm">Created: {bulkResults.join(", ")}</p>
          <button onClick={() => setBulkResults(null)} className="ml-auto text-emerald-400 hover:text-emerald-200"><X size={16} /></button>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tags…" className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-zinc-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          {search ? "No tags match your search." : "No tags yet. Add one above."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900/80">
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">ID</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Name</th>
                <th className="text-right px-4 py-3 text-zinc-400 font-medium">Wallpapers</th>
                <th className="text-right px-4 py-3 text-zinc-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((tag) => (
                <tr key={tag.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{tag.id}</td>
                  <td className="px-4 py-3 text-zinc-100 font-medium">{tag.name}</td>
                  <td className="px-4 py-3 text-right text-zinc-300">{counts[tag.id] ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startRename(tag)} className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 transition-all" title="Rename">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(tag.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
