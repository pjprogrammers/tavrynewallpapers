"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { useWallpaperData } from "@/lib/use-wallpaper-data";
import type { WallpaperMetadata } from "@/lib/firestore-types";

interface Props {
  slug: string;
  staticWallpaper: WallpaperMetadata;
  children: ReactNode;
}

interface WallpaperContextValue {
  wallpaper: WallpaperMetadata;
  isLive: boolean;
}

const WallpaperContext = createContext<WallpaperContextValue | null>(null);

export function useWallpaperContext(): WallpaperContextValue {
  const ctx = useContext(WallpaperContext);
  if (ctx) return ctx;
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
  const { wallpaper: liveWallpaper, loading } = useWallpaperData(slug);

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
      {children}
    </WallpaperContext.Provider>
  );
}
