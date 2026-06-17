"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";

import { useUserRoles } from "@/lib/use-user-roles";
import { useAuth } from "@/lib/auth-context";
import WallpaperEditModal from "./WallpaperEditModal";
import type { WallpaperMetadata } from "@/lib/firestore-types";

interface EditWallpaperButtonProps {
  slug: string;
  wallpaper: WallpaperMetadata;
  className?: string;
  onSaved?: () => void | Promise<void>;
}

export default function EditWallpaperButton({
  slug,
  wallpaper,
  className = "",
  onSaved: externalOnSaved,
}: EditWallpaperButtonProps) {
  const { user } = useAuth();
  const { canEdit, loading: rolesLoading, refreshToken } = useUserRoles();
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (rolesLoading) return;
    setShouldRender(canEdit && !!user);
  }, [canEdit, user, rolesLoading]);

  if (!shouldRender) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`edit-wallpaper-button ${className}`}
        aria-label={`Edit wallpaper "${wallpaper.title}"`}
      >
        <Pencil size={14} aria-hidden="true" />
        <span>Edit</span>
      </button>

      {isOpen && (
        <WallpaperEditModal
          slug={slug}
          wallpaper={wallpaper}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSaved={async () => {
            await refreshToken();
            if (externalOnSaved) await externalOnSaved();
            setIsOpen(false);
          }}
        />
      )}
    </>
  );
}
