"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Heart, Eye, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useLike,
  useDownload,
  useRealtimeWallpaperStats,
  useImpression,
  useClickTracking,
} from "@/lib/use-firestore";
import type { WallpaperMetadata } from "@/lib/firestore-types";

interface FirestoreWallpaperCardProps {
  wallpaper: {
    id: string;
    title: string;
    filename: string;
    slug: string;
    categoryId: string;
    tags: string[];
    resolution?: string;
    uploaderId?: string;
    createdAt?: Date;
  };
  position?: number;
  source?: "grid" | "featured" | "trending" | "search" | "category" | "related";
  priority?: boolean;
  className?: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return Math.floor(num / 1000000) + "M";
  if (num >= 1000) return Math.floor(num / 1000) + "K";
  return num.toLocaleString();
};

export const FirestoreWallpaperCard = ({
  wallpaper,
  position = 0,
  source = "grid",
  priority = false,
  className = "",
}: FirestoreWallpaperCardProps) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  // Track impression when card is rendered
  useImpression(wallpaper.id, { source, position });

  // Realtime stats for this wallpaper
  const stats = useRealtimeWallpaperStats(wallpaper.id);

  // Click tracking
  const clickSource = source === "trending" || source === "category"
    ? "grid"
    : source as "grid" | "featured" | "search" | "related" | "direct";
  const { trackClick } = useClickTracking(wallpaper.id, { source: clickSource });

  // Like functionality
  const { isLiked, loading: likeLoading, toggle: toggleLike } = useLike(
    wallpaper.id,
    {
      slug: wallpaper.slug,
      title: wallpaper.title,
      thumbnail: `/wallpapers/${wallpaper.filename}`,
    }
  );

  // Download functionality
  const { download: recordAndDownload } = useDownload(wallpaper.id, wallpaper.slug);

  const handleCardClick = useCallback(() => {
    trackClick();
  }, [trackClick]);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Please sign in to like wallpapers");
      return;
    }
    setIsLikeAnimating(true);
    await toggleLike();
    setTimeout(() => setIsLikeAnimating(false), 500);
  };

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await recordAndDownload(wallpaper.resolution || "3840x2160", "original");

    // Direct download
    const link = document.createElement("a");
    link.href = `/wallpapers/${wallpaper.filename}`;
    link.download = `${wallpaper.slug || wallpaper.title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`wallpaper-card-v2 ${isHovered ? "hovered" : ""} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={`/wallpaper/${wallpaper.slug}`}
        className="wallpaper-card-v2-link"
        onClick={handleCardClick}
      >
        {/* Image Container */}
        <div className="wallpaper-card-v2-image">
          <Image
            src={`/wallpapers/${wallpaper.filename}`}
            alt={wallpaper.title}
            fill
            className={`wallpaper-card-v2-img ${isLoading ? "loading" : "loaded"}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={priority}
            onLoad={() => setIsLoading(false)}
          />

          {/* Gradient Overlay */}
          <div className="wallpaper-card-v2-gradient" />
        </div>

        {/* Top Bar */}
        <div className={`wallpaper-card-v2-top ${isHovered ? "visible" : ""}`}>
          <span className="wallpaper-card-v2-category">
            <Sparkles size={12} />
            {wallpaper.categoryId}
          </span>

          {/* Action Buttons */}
          <div className="wallpaper-card-v2-actions">
            <button
              onClick={handleLikeClick}
              disabled={likeLoading}
              className={`wallpaper-card-v2-action ${isLiked ? "liked" : ""} ${isLikeAnimating ? "animating" : ""}`}
              title={isLiked ? "Unlike" : "Like"}
            >
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`wallpaper-card-v2-bottom ${isHovered ? "visible" : ""}`}>
          <div className="wallpaper-card-v2-info">
            <h3 className="wallpaper-card-v2-title">{wallpaper.title}</h3>
            {wallpaper.resolution && (
              <span className="wallpaper-card-v2-resolution">{wallpaper.resolution}</span>
            )}
          </div>

          <button
            onClick={handleDownloadClick}
            className="wallpaper-card-v2-download"
          >
            <Download size={16} />
            <span>Download</span>
          </button>
        </div>
      </Link>

      {/* Stats Bar */}
      <div className={`wallpaper-card-v2-stats ${isHovered ? "hidden" : ""}`}>
        <div className="wallpaper-card-v2-stat">
          <Eye size={14} />
          <span>{formatNumber(stats?.views || 0)}</span>
        </div>
        <div className="wallpaper-card-v2-stat">
          <Download size={14} />
          <span>{formatNumber(stats?.downloads || 0)}</span>
        </div>
        <div className="wallpaper-card-v2-stat">
          <Heart size={14} fill={isLiked ? "var(--heart)" : "none"} className={isLiked ? "heart-filled" : ""} />
          <span>{formatNumber(stats?.likes || 0)}</span>
        </div>
      </div>
    </div>
  );
};

export default FirestoreWallpaperCard;
