"use client";

import { Wallpaper } from "../lib/wallpapers";
import MasonryGrid from "./MasonryGrid";

interface WallpaperGridWithStatsProps {
  wallpapers: Wallpaper[];
}

export default function WallpaperGridWithStats({
  wallpapers,
}: WallpaperGridWithStatsProps) {
  return <MasonryGrid wallpapers={wallpapers} />;
}
