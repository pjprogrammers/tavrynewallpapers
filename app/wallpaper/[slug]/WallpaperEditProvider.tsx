"use client";

/**
 * 🔄 WallpaperEditProvider
 * ==========================
 *
 * Client wrapper that:
 *  1. Subscribes to the live Firestore document for the wallpaper.
 *  2. Renders the Edit pencil button if the user is a moderator.
 *  3. Wraps the pre-built children tree with merged live data
 *     via React Context (instead of a render-prop function).
 *
 * The static data is passed as a fallback (so the page renders
 * even before Firestore has the document — e.g. right after a
 * fresh deploy before `npm run seed-wallpapers` has been run).
 *
 * Why Context instead of `children: (data) => ...`?
 * ------------------------------------------------
 * The previous implementation used a render-prop function. That
 * function could not be serialised across the Server / Client
 * boundary, which is what caused:
 *
 *   "An error occurred in the Server Components render."
 *
 * and the wallpaper detail page not opening at all. Using
 * Context keeps the boundary clean: the server renders the
 * static markup, the client hydrates and overrides via the
 * `useWallpaperContext()` hook used in the leaf components
 * (title, description, tags, etc.).
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
  /** Static children. They read live data via `useWallpaperContext()`. */
  children: ReactNode;
}

interface WallpaperContextValue {
  /** The merged wallpaper (static + live Firestore). */
  wallpaper: WallpaperMetadata;
  /** True if the live Firestore doc has been received at least once. */
  isLive: boolean;
}

const WallpaperContext = createContext<WallpaperContextValue | null>(null);

/**
 * Hook used by the wallpaper detail page sub-components (title,
 * description, tags, info card, etc.) to read the merged
 * wallpaper data. Falls back to the value passed in props if
 * the provider is missing.
 */
export function useWallpaperContext(): WallpaperContextValue {
  const ctx = useContext(WallpaperContext);
  if (ctx) return ctx;
  // Safe fallback: a default object that callers can destructure
  // without crashing if the provider is ever unmounted.
  return {
    wallpaper: {
      slug: "",
      id: "",
      title: "",
      categoryId: "",
      tags: [],
      filename: "",
      uploadDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    isLive: false,
  };
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

  // Force a token refresh once on mount so the latest custom
  // claims (set via `npm run role`) are reflected immediately.
  useEffect(() => {
    if (user && !tokenRefreshed) {
      refreshToken()
        .catch(() => {})
        .finally(() => setTokenRefreshed(true));
    }
  }, [user, refreshToken, tokenRefreshed]);

  const value = useMemo<WallpaperContextValue>(() => {
    if (!liveWallpaper) {
      return { wallpaper: staticWallpaper, isLive: false };
    }
    return {
      wallpaper: { ...staticWallpaper, ...liveWallpaper },
      isLive: true && !loading,
    };
  }, [staticWallpaper, liveWallpaper, loading]);

  return (
    <WallpaperContext.Provider value={value}>
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
            wallpaper={value.wallpaper}
            onSaved={refreshToken}
          />
        </div>
      )}
      {children}
    </WallpaperContext.Provider>
  );
}
