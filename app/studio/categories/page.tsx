"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Loader2, Plus, Pencil, Trash2, Layers, AlertCircle, CheckCircle2, X, Search, List,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import {
  listCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getAllCategoryCounts,
} from "@/lib/category-store";
import type { CategoryDoc } from "@/lib/firestore-types";
import { slugify } from "@/lib/slug";

export default function StudioCategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ id: "", name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResults, setBulkResults] = useState<string[] | null>(null);

  const canEdit = user && hasPermission(user, "wallpaper.edit", roles);

  const load = useCallback(async () => {
    setLoading(true);
    const [cats, cnts] = await Promise.all([
      listCategories(),
      getAllCategoryCounts().catch(() => ({})),
    ]);
    setCategories(cats);
    setCounts(cnts);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !rolesLoading && canEdit) load();
  }, [authLoading, rolesLoading, canEdit, load]);

  const handleAdd = async () => {
    if (!form.id.trim() || !form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await addCategory(slugify(form.id.trim()), form.name.trim(), form.description.trim() || undefined);
      setShowAdd(false);
      setForm({ id: "", name: "", description: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add category");
    } finally {
      setSaving(false);
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
        const id = slugify(name);
        if (!id) continue;
        await addCategory(id, name);
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

  const handleUpdate = async () => {
    if (!editId || !form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateCategory(editId, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
      setEditId(null);
      setForm({ id: "", name: "", description: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete category "${id}"? Wallpapers in this category will keep their current categoryId.`)) return;
    try {
      await deleteCategory(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete category");
    }
  };

  const openEdit = (cat: CategoryDoc) => {
    setEditId(cat.id);
    setForm({ id: cat.id, name: cat.name, description: cat.description ?? "" });
  };

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.includes(search.toLowerCase()),
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
          <Layers size={24} className="text-amber-500" />
          <h1 className="text-2xl font-bold text-zinc-100">Categories</h1>
          <span className="text-sm text-zinc-500">({categories.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setBulkMode(true); setBulkInput(""); setBulkResults(null); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all"
          >
            <List size={16} /> Bulk Add
          </button>
          <button
            onClick={() => { setShowAdd(true); setEditId(null); setForm({ id: "", name: "", description: "" }); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-all"
          >
            <Plus size={16} /> Add Category
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

      {(showAdd || editId) && (
        <div className="mb-8 p-6 rounded-xl bg-zinc-900/70 border border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-200 mb-4">
            {editId ? "Edit Category" : "Add Category"}
          </h3>
          <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">ID (URL slug) — auto-generated from name</label>
                <input
                  type="text"
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  disabled={!!editId}
                  placeholder="e.g. cyberpunk"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 disabled:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value, id: editId ? form.id : slugify(e.target.value) }); }}
                  placeholder="e.g. Cyberpunk"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Optional description"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={editId ? handleUpdate : handleAdd}
                disabled={saving || !form.id.trim() || !form.name.trim()}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-all"
              >
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
              <button
                onClick={() => { setShowAdd(false); setEditId(null); setForm({ id: "", name: "", description: "" }); }}
                className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkMode && (
        <div className="mb-8 p-6 rounded-xl bg-zinc-900/70 border border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">Bulk Add Categories</h3>
          <p className="text-sm text-zinc-500 mb-4">Enter category names separated by commas. Slugs will be auto-generated.</p>
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            rows={4}
            placeholder="Cyberpunk, Nature, Anime, Gaming, Abstract"
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-4"
          />
          <div className="flex gap-3">
            <button onClick={handleBulkAdd} disabled={saving || !bulkInput.trim()}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-all">
              {saving ? "Creating..." : `Create ${bulkInput.split(",").filter(Boolean).length} categories`}
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
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories…"
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-zinc-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          {search ? "No categories match your search." : "No categories yet. Add one above."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900/80">
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">ID</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Description</th>
                <th className="text-right px-4 py-3 text-zinc-400 font-medium">Wallpapers</th>
                <th className="text-right px-4 py-3 text-zinc-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{cat.id}</td>
                  <td className="px-4 py-3 text-zinc-100 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs max-w-[200px] truncate">{cat.description || "—"}</td>
                  <td className="px-4 py-3 text-right text-zinc-300">{counts[cat.id] ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 transition-all">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all">
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
