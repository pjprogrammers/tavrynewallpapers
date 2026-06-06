"use client";

/**
 * ✏️ EditWallpaperButton
 * =======================
 *
 * Renders a floating "edit" pencil icon button on the wallpaper page.
 * Visible only to users with the moderator (or admin) role.
 * Clicking it opens the <WallpaperEditModal />.
 *
 * Pure presentational + permission check. The actual edit logic is
 * in `WallpaperEditModal`.
 */

import { useState, useEffect } from "react";
import { Pencil, ShieldCheck } from "lucide-react";

import { useUserRoles } from "@/lib/use-user-roles";
import { useAuth } from "@/lib/auth-context";
import WallpaperEditModal from "./WallpaperEditModal";
import type { WallpaperMetadata } from "@/lib/firestore-types";

interface EditWallpaperButtonProps {
  /** The slug of the wallpaper to edit (= URL path / Firestore doc ID). */
  slug: string;
  /** Current wallpaper state. Used to pre-populate the modal form. */
  wallpaper: WallpaperMetadata;
  /** Optional className for layout customization. */
  className?: string;
  /**
   * Optional callback fired after a successful save. Useful for
   * forcing a token refresh, refreshing the edit history, etc.
   */
  onSaved?: () => void | Promise<void>;
}

export default function EditWallpaperButton({
  slug,
  wallpaper,
  className = "",
  onSaved: externalOnSaved,
}: EditWallpaperButtonProps) {
  const { user } = useAuth();
  const { canEdit, isAdmin, loading: rolesLoading, refreshToken } = useUserRoles();
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Wait for auth + roles to resolve before deciding to render
  useEffect(() => {
    if (rolesLoading) return;
    setShouldRender(canEdit && !!user);
  }, [canEdit, user, rolesLoading]);

  // Don't render anything if the user cannot edit
  if (!shouldRender) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`edit-wallpaper-button ${className}`}
        aria-label={`Edit wallpaper "${wallpaper.title}"`}
        title={
          isAdmin
            ? "Edit wallpaper (admin)"
            : "Edit wallpaper (moderator)"
        }
      >
        {isAdmin ? <ShieldCheck size={16} aria-hidden="true" /> : <Pencil size={16} aria-hidden="true" />}
        <span className="edit-wallpaper-button-label">
          {isAdmin ? "Admin Edit" : "Edit"}
        </span>
      </button>

      {isOpen && (
        <WallpaperEditModal
          slug={slug}
          wallpaper={wallpaper}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSaved={async () => {
            // Force an ID-token refresh on save so role changes take
            // effect immediately (in case this user just got a new
            // role themselves).
            await refreshToken();
            if (externalOnSaved) await externalOnSaved();
            setIsOpen(false);
          }}
        />
      )}
    </>
  );
}
