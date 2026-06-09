"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Heart, Eye, Sparkles, Sparkle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useLike,
  useDownload,
  useRealtimeWallpaperStats,
  useImpression,
  useClickTracking,
} from "@/lib/use-firestore";
import { Wallpaper, getCategoryById } from "../lib/wallpapers";
import { getRecencyBadge } from "@/lib/wallpaper-time";
import { resolveImageUrl, resolveThumbnailUrl } from "@/lib/wallpaper-image";

interface WallpaperCardProps {
  wallpaper?: Wallpaper;
  id?: string;
  title?: string;
  imageSrc?: string;
  author?: string;
  likes?: number;
  downloads?: number;
  category?: string;
  position?: number;
  source?: "grid" | "featured" | "trending" | "search" | "category" | "related";
  priority?: boolean;
  className?: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return Math.floor(num / 1000000) + "M";
  if (num >= 1000) return Math.floor(num / 1000) + "K";
  return num.toString();
};

const WallpaperCard = ({
  wallpaper,
  id,
  title,
  imageSrc,
  author,
  likes,
  downloads,
  category: categoryProp,
  position = 0,
  source = "grid",
  priority = false,
  className = "",
}: WallpaperCardProps) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  // Safe wallpaper object — memoized so the dependent useMemo below
  // (recency badge) doesn't recompute on every render.
  const wallpaperData: Wallpaper = useMemo(() => wallpaper || {
    id: id || "",
    title: title || "",
    filename: imageSrc?.split("/").pop() || "",
    slug: (title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    categoryId: (categoryProp || "").toLowerCase(),
    tags: [],
    views: likes || 0,
    downloads: downloads || 0,
    likes: likes || 0,
    featured: true,
    trending: true,
    uploadDate: new Date().toISOString().split("T")[0],
    resolution: "3840x2160"
  }, [wallpaper, id, title, imageSrc, categoryProp, likes, downloads]);

  const category = getCategoryById(wallpaperData.categoryId);

  // Track impression when card is rendered
  useImpression(wallpaperData.id, { source, position });

  // Realtime stats for this wallpaper
  const stats = useRealtimeWallpaperStats(wallpaperData.id);

  // Click tracking
  const { trackClick } = useClickTracking(wallpaperData.id, {
    source: source === "trending" || source === "category" ? "grid" : source
  });

  // Like functionality
  const { isLiked, loading: likeLoading, toggle: toggleLike } = useLike(
    wallpaperData.id,
    {
      slug: wallpaperData.slug,
      title: wallpaperData.title,
      thumbnail: resolveThumbnailUrl(wallpaperData) ?? "",
    }
  );

  // Download functionality
  const { download: recordAndDownload } = useDownload(wallpaperData.id, wallpaperData.slug);

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
    if (!user) {
      alert("Please sign in to track downloads");
      return;
    }
    await recordAndDownload(wallpaperData.resolution || "3840x2160", "original");

    // Direct download
    const link = document.createElement("a");
    link.href = resolveImageUrl(wallpaperData) ?? `/wallpapers/${wallpaperData.filename}`;
    link.download = `${wallpaperData.slug || wallpaperData.title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showDetailedHover = source !== "grid";

  const recencyBadge = useMemo(() => getRecencyBadge(wallpaperData), [wallpaperData]);

  return (
    <div
      className={`wallpaper-card-v2 ${isHovered ? "hovered" : ""} ${showDetailedHover ? "detailed-hover" : ""} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={`/wallpaper/${wallpaperData.slug}`}
        className="wallpaper-card-v2-link"
        onClick={handleCardClick}
      >
        {/* Image Container */}
        <div className="wallpaper-card-v2-image">
          <Image
            src={resolveThumbnailUrl(wallpaperData) ?? `/wallpapers/${wallpaperData.filename}`}
            alt={wallpaperData.title}
            fill
            className={`wallpaper-card-v2-img ${isLoading ? "loading" : "loaded"}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={priority}
            onLoad={() => setIsLoading(false)}
          />

          {/* Gradient Overlay */}
          <div className="wallpaper-card-v2-gradient" />

          {/* Recency badge (always visible when present) */}
          {recencyBadge && (
            <span
              className={`wallpaper-card-v2-recency wallpaper-card-v2-recency-${recencyBadge}`}
              aria-label={recencyBadge === "new" ? "New or recently updated" : "Recently updated"}
              title={recencyBadge === "new" ? "New or recently updated" : "Recently updated"}
            >
              <Sparkle size={10} />
              {recencyBadge === "new" ? "New" : "Updated"}
            </span>
          )}
        </div>

        {/* Top Bar */}
        <div className={`wallpaper-card-v2-top ${isHovered ? "visible" : ""}`}>
          {category && (
            <span className="wallpaper-card-v2-category">
              <Sparkles size={12} />
              {category.name}
            </span>
          )}

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
            <h3 className="wallpaper-card-v2-title">{wallpaperData.title}</h3>
            {wallpaperData.resolution && (
              <span className="wallpaper-card-v2-resolution">{wallpaperData.resolution}</span>
            )}
            {/* Enhanced hover info - tags */}
            {showDetailedHover && wallpaperData.tags && wallpaperData.tags.length > 0 && (
              <div className="wallpaper-card-v2-tags">
                {wallpaperData.tags.slice(0, 3).map((tag, idx) => (
                  <span key={`${tag}-${idx}`} className="wallpaper-card-v2-tag">{tag}</span>
                ))}
                {wallpaperData.tags.length > 3 && (
                  <span className="wallpaper-card-v2-tag-more">+{wallpaperData.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>

          {/* Enhanced hover info - detailed stats */}
          {showDetailedHover && (
            <div className="wallpaper-card-v2-detailed-stats">
              <div className="wallpaper-card-v2-stat-item">
                <Eye size={14} />
                <span>{formatNumber(stats?.views || wallpaperData.views || 0)}</span>
              </div>
              <div className="wallpaper-card-v2-stat-item">
                <Download size={14} />
                <span>{formatNumber(stats?.downloads || wallpaperData.downloads || 0)}</span>
              </div>
              <div className="wallpaper-card-v2-stat-item">
                <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                <span>{formatNumber(stats?.likes || 0)}</span>
              </div>
            </div>
          )}

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
          <span>{formatNumber(stats?.views || wallpaperData.views || 0)}</span>
        </div>
        <div className="wallpaper-card-v2-stat">
          <Download size={14} />
          <span>{formatNumber(stats?.downloads || wallpaperData.downloads || 0)}</span>
        </div>
        <div className="wallpaper-card-v2-stat">
          <Heart size={14} fill={isLiked ? "var(--heart)" : "none"} className={isLiked ? "heart-filled" : ""} />
          <span>{formatNumber(stats?.likes || 0)}</span>
        </div>
      </div>
    </div>
  );
};

export default WallpaperCard;
