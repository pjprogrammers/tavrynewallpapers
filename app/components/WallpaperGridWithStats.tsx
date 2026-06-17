"use client";

import { Download, Heart, Eye, Maximize2 } from "lucide-react";
import { Wallpaper } from "../lib/wallpapers";
import Link from "next/link";
import Image from "next/image";
import { createSlug } from "@/lib/slug";
import { resolveThumbnailUrl } from "@/lib/wallpaper-image";

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
  return (
    <Link href={`/wallpaper/${wallpaper.id}/${createSlug(wallpaper.title)}`} className="wallpaper-card-v3">
      <div className="wallpaper-v3-image-wrapper">
        <Image
          src={resolveThumbnailUrl(wallpaper) ?? `/wallpapers/${wallpaper.filename}`}
          alt={wallpaper.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
              {formatNumber(wallpaper.views ?? 0)}
            </span>
            <span className="wallpaper-v3-stat">
              <Heart size={12} />
              {formatNumber(wallpaper.favorites ?? 0)}
            </span>
            <span className="wallpaper-v3-stat">
              <Download size={12} />
              {formatNumber(wallpaper.downloads ?? 0)}
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