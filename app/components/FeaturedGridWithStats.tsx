"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRealtimeWallpaperStats } from "@/lib/use-firestore";
import { Wallpaper } from "../lib/wallpapers";

interface FeaturedGridWithStatsProps {
  wallpapers: Wallpaper[];
}

interface FeaturedItemWithStatsProps {
  wallpaper: Wallpaper;
  index: number;
}

function FeaturedItemWithStats({ wallpaper, index }: FeaturedItemWithStatsProps) {
  return (
    <Link
      href={`/wallpaper/${wallpaper.slug}`}
      className={`featured-item-v2 featured-item-v2-clean featured-item-${index} animate-fade-in`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="featured-v2-image-container">
        <Image
          src={`/wallpapers/${wallpaper.filename}`}
          alt={wallpaper.title}
          fill
          className="featured-v2-image"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={index < 2}
        />
        <div className="featured-v2-overlay">
          <div className="featured-v2-content-clean">
            <h3 className="featured-v2-title-clean">{wallpaper.title}</h3>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedGridWithStats({ wallpapers }: FeaturedGridWithStatsProps) {
  return (
    <div className="featured-grid-v2">
      {wallpapers.map((wallpaper, index) => (
        <FeaturedItemWithStats key={wallpaper.id} wallpaper={wallpaper} index={index} />
      ))}
    </div>
  );
}