"use client";

import { Wallpaper } from "../lib/wallpapers";
import WallpaperCard from "./WallpaperCard";
import { useEffect, useState } from "react";

interface WallpaperGridProps {
  wallpapers: Wallpaper[];
  className?: string;
  source?: "grid" | "featured" | "trending" | "search" | "category" | "related";
}

const WallpaperGrid = ({ wallpapers, className = "", source = "grid" }: WallpaperGridProps) => {
  return (
    <div className={`wallpaper-grid ${className}`}>
      {wallpapers.map((wallpaper, index) => (
        <WallpaperCard
          key={wallpaper.id}
          wallpaper={wallpaper}
          priority={index < 4}
          source={source}
        />
      ))}
      
      {wallpapers.length === 0 && (
        <div className="wallpaper-grid-empty">
          <p>No wallpapers found</p>
        </div>
      )}
    </div>
  );
};

export default WallpaperGrid; 