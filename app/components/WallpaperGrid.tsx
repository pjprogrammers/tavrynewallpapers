"use client";

import { Wallpaper } from "../lib/wallpapers";
import MasonryGrid from "./MasonryGrid";

interface WallpaperGridProps {
  wallpapers: Wallpaper[];
  className?: string;
  columnCount?: number;
}

const WallpaperGrid = ({
  wallpapers,
  className = "",
  columnCount,
}: WallpaperGridProps) => {
  return (
    <MasonryGrid
      wallpapers={wallpapers}
      className={className}
      columnCount={columnCount}
    />
  );
};

export default WallpaperGrid;
