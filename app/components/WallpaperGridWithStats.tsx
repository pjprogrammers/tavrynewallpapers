"use client";

import { useMemo } from "react";
import { Download, Heart, Eye, Maximize2 } from "lucide-react";
import { useRealtimeWallpaperStats } from "@/lib/use-firestore";
import { Wallpaper } from "../lib/wallpapers";
import Link from "next/link";

interface WallpaperGridWithStatsProps {
  wallpapers: Wallpaper[];
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

interface WallpaperCardWithStatsProps {
  wallpaper: Wallpaper;
}

function WallpaperCardWithStats({ wallpaper }: WallpaperCardWithStatsProps) {
  const stats = useRealtimeWallpaperStats(wallpaper.id);

  const displayStats = useMemo(() => {
    if (stats) {
      return {
        downloads: stats.downloads ?? wallpaper.downloads,
        likes: stats.likes ?? Math.floor(wallpaper.downloads * 0.7),
        views: stats.views ?? wallpaper.views,
      };
    }
    return {
      downloads: wallpaper.downloads,
      likes: Math.floor(wallpaper.downloads * 0.7),
      views: wallpaper.views,
    };
  }, [stats, wallpaper.downloads, wallpaper.views]);

  return (
    <Link href={`/wallpaper/${wallpaper.slug}`} className="wallpaper-card-v3">
      <div className="wallpaper-v3-image-wrapper">
        <img
          src={`/wallpapers/${wallpaper.filename}`}
          alt={wallpaper.title}
          loading="lazy"
          className="wallpaper-v3-image"
        />
        <div className="wallpaper-v3-overlay">
          <div className="wallpaper-v3-resolution">
            <Maximize2 size={12} />
            {wallpaper.resolution}
          </div>
          <div className="wallpaper-v3-stats">
            <span className="wallpaper-v3-stat">
              <Eye size={12} />
              {formatNumber(displayStats.views)}
            </span>
            <span className="wallpaper-v3-stat">
              <Heart size={12} />
              {formatNumber(displayStats.likes)}
            </span>
            <span className="wallpaper-v3-stat">
              <Download size={12} />
              {formatNumber(displayStats.downloads)}
            </span>
          </div>
        </div>
        <div className="wallpaper-v3-glow" />
      </div>
      <div className="wallpaper-v3-info">
        <h3 className="wallpaper-v3-title">{wallpaper.title}</h3>
        <div className="wallpaper-v3-meta">
          <span className="wallpaper-v3-category">{wallpaper.categoryId}</span>
        </div>
      </div>
    </Link>
  );
}

export default function WallpaperGridWithStats({ wallpapers }: WallpaperGridWithStatsProps) {
  return (
    <div className="wallpapers-grid-v3">
      {wallpapers.map((wallpaper) => (
        <WallpaperCardWithStats key={wallpaper.id} wallpaper={wallpaper} />
      ))}
    </div>
  );
}