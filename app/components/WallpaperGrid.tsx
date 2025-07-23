"use client";

import { Wallpaper } from "../lib/wallpapers";
import WallpaperCard from "./WallpaperCard";
import { useEffect, useState } from "react";

interface WallpaperGridProps {
  wallpapers: Wallpaper[];
  className?: string;
}

const WallpaperGrid = ({ wallpapers, className = "" }: WallpaperGridProps) => {
  return (
    <div className={`wallpaper-grid ${className}`}>
      {wallpapers.map((wallpaper, index) => (
        <WallpaperCard 
          key={wallpaper.id} 
          wallpaper={wallpaper}
          priority={index < 4}
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