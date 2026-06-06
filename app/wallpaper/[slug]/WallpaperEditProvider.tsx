"use client";

/**
 * 🔄 WallpaperEditProvider
 * ==========================
 *
 * Client wrapper that:
 *  1. Subscribes to the live Firestore document for the wallpaper.
 *  2. Merges the static (build-time) data with the Firestore live data.
 *  3. Renders the Edit pencil button if the user is a moderator.
 *  4. Re-renders child content with the merged data, so the rest of
 *     the page (title, description, tags, etc.) updates in real-time
 *     after a moderator saves an edit.
 *
 * The static data is passed as a fallback (so the page renders even
 * before Firestore has the document — e.g. right after a fresh
 * deploy before `npm run seed-wallpapers` has been run).
 */

import { useEffect, useState, useMemo } from "react";

import { useUserRoles } from "@/lib/use-user-roles";
import { useAuth } from "@/lib/auth-context";
import EditWallpaperButton from "@/app/components/EditWallpaperButton";
import { useWallpaperData } from "@/lib/use-wallpaper-data";
import type { WallpaperMetadata } from "@/lib/firestore-types";

interface Props {
  /** Slug = URL path segment = Firestore doc ID. */
  slug: string;
  /** Static seed data (used as the initial render + fallback). */
  staticWallpaper: WallpaperMetadata;
  /**
   * Children that consume the merged wallpaper. They are wrapped in a
   * re-render boundary so the realtime updates propagate.
   */
  children: (merged: WallpaperMetadata, isLive: boolean) => React.ReactNode;
}

/**
 * Deep-merge a partial Firestore document into the static base.
 * The Firestore value always wins when present.
 */
function mergeWallpaper(
  base: WallpaperMetadata,
  live: WallpaperMetadata | null
): { merged: WallpaperMetadata; isLive: boolean } {
  if (!live) return { merged: base, isLive: false };
  return { merged: { ...base, ...live }, isLive: true };
}

export default function WallpaperEditProvider({
  slug,
  staticWallpaper,
  children,
}: Props) {
  const { user } = useAuth();
  const { canEdit, loading: rolesLoading, refreshToken } = useUserRoles();
  const { wallpaper: liveWallpaper, loading } = useWallpaperData(slug);
  const [tokenRefreshed, setTokenRefreshed] = useState(false);

  // Force a token refresh once on mount so the latest custom claims
  // (set via `npm run role`) are reflected immediately.
  useEffect(() => {
    if (user && !tokenRefreshed) {
      refreshToken()
        .catch(() => {})
        .finally(() => setTokenRefreshed(true));
    }
  }, [user, refreshToken, tokenRefreshed]);

  const { merged, isLive } = useMemo(
    () => mergeWallpaper(staticWallpaper, liveWallpaper),
    [staticWallpaper, liveWallpaper]
  );

  return (
    <>
      {/* Edit button (only for moderators / admins) */}
      {!rolesLoading && user && canEdit && (
        <div
          className="wallpaper-edit-container"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "1rem",
          }}
        >
          <EditWallpaperButton
            slug={slug}
            wallpaper={merged}
            onSaved={refreshToken}
          />
        </div>
      )}
      {children(merged, isLive && !loading)}
    </>
  );
}
