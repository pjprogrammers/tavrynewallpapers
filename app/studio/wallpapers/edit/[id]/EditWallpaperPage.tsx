"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import {
  applyWallpaperEdit,
  validateWallpaperEdit,
} from "@/lib/wallpaper-store";
import type { WallpaperMetadata, WallpaperEditPayload } from "@/lib/firestore-types";
import { revalidateWallpaperPaths } from "@/app/actions/revalidate";
import EditWallpaperFormFields, {
  type FormState,
  toFormState,
} from "@/app/components/EditWallpaperFormFields";

export default function EditWallpaperPage({
  wallpaper,
}: {
  wallpaper: WallpaperMetadata;
}) {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(wallpaper));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canEdit =
    !authLoading && !rolesLoading && user && hasPermission(user, "wallpaper.edit", roles);

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const addTag = useCallback((raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || tag.length > 32) return;
    setForm((f) => (f.tags.includes(tag) ? f : { ...f, tags: [...f.tags, tag] }));
  }, []);

  const removeTag = useCallback((tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload: WallpaperEditPayload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        categoryId: form.categoryId,
        tags: form.tags,
        resolution: form.resolution.trim() || undefined,
        width: form.width.trim() ? parseInt(form.width.trim(), 10) || undefined : undefined,
        height: form.height.trim() ? parseInt(form.height.trim(), 10) || undefined : undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        storageProvider: form.storageProvider || undefined,
        featured: form.featured,
        trending: form.trending,
        visible: form.visible,
        published: form.published,
      };

      try {
        validateWallpaperEdit(payload);
        const { changes } = await applyWallpaperEdit(wallpaper.slug, payload, {
          uid: user.uid,
          displayName: user.displayName || user.email || "Unknown",
          email: user.email || "",
        });
        const count = Object.keys(changes).length;
        if (count > 0) {
          try {
            await revalidateWallpaperPaths(wallpaper.slug, {
              categoryId: !!changes.categoryId,
              tags: !!changes.tags,
              featured: !!changes.featured,
              trending: !!changes.trending,
            });
          } catch {
            // non-fatal
          }
        }
        setSuccess(
          count === 0
            ? "No changes detected."
            : `Saved ${count} field${count === 1 ? "" : "s"}.`
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSaving(false);
      }
    },
    [user, form, wallpaper.slug]
  );

  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user || !canEdit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle size={48} className="text-red-400" />
        <h2 className="text-xl font-semibold text-zinc-300">Access Denied</h2>
        <p className="text-zinc-500">You need moderator or admin privileges to edit wallpapers.</p>
        <Link href="/" className="text-amber-500 hover:text-amber-400 underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/studio/wallpapers"
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Edit Wallpaper</h1>
        <span className="text-xs text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded">#{wallpaper.id}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <EditWallpaperFormFields
          form={form}
          update={update}
          addTag={addTag}
          removeTag={removeTag}
          saving={saving}
          error={error}
          success={success}
          wallpaper={wallpaper}
        />
      </form>
    </div>
  );
}
