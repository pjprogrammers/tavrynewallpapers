"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createSlug } from "@/lib/slug";
import { Download, Heart, Eye, Sparkles, Sparkle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useFavorite,
  useDownload,
  useImpression,
  useClickTracking,
} from "@/lib/use-firestore";
import { Wallpaper } from "../lib/wallpapers";
import { getCategoryById } from "@/lib/category-store";
import type { CategoryDoc } from "@/lib/firestore-types";
import { getRecencyBadge } from "@/lib/wallpaper-time";
import { resolveImageUrl, resolveThumbnailUrl } from "@/lib/wallpaper-image";
import { fmtCompact } from "@/lib/format";

interface WallpaperCardProps {
  wallpaper?: Wallpaper;
  id?: string;
  title?: string;
  imageSrc?: string;
  author?: string;
  views?: number;
  downloads?: number;
  category?: string;
  position?: number;
  source?: "grid" | "featured" | "trending" | "search" | "category" | "related";
  priority?: boolean;
  className?: string;
}

const WallpaperCard = ({
  wallpaper,
  id,
  title,
  imageSrc,
  author,
  views: viewCount,
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
    views: viewCount || 0,
    downloads: downloads || 0,
    favorites: 0,
    featured: true,
    trending: true,
    uploadDate: new Date().toISOString().split("T")[0],
    resolution: "3840x2160",
    createdAt: new Date(),
    updatedAt: new Date(),
  }, [wallpaper, id, title, imageSrc, categoryProp, viewCount, downloads]);

  const [category, setCategory] = useState<CategoryDoc | null>(null);
  useEffect(() => {
    getCategoryById(wallpaperData.categoryId).then(setCategory);
  }, [wallpaperData.categoryId]);

  // Track impression when card is rendered
  useImpression(wallpaperData.slug);

  // Click tracking
  const { trackClick } = useClickTracking(wallpaperData.slug);

  // Favorite functionality
  const { isFavorited, loading: favLoading, toggle: toggleFav } = useFavorite(
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

  const handleFavClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Please sign in to favorite wallpapers");
      return;
    }
    setIsLikeAnimating(true);
    await toggleFav();
    setTimeout(() => setIsLikeAnimating(false), 500);
  };

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const fileName = `${wallpaperData.slug || wallpaperData.title}.jpg`;
    const imgUrl = resolveImageUrl(wallpaperData) ?? `/wallpapers/${wallpaperData.filename}`;
    await recordAndDownload(wallpaperData.resolution || "3840x2160", "original");

    const params = new URLSearchParams({ url: imgUrl, filename: fileName });
    const link = document.createElement("a");
    link.href = `/api/download?${params}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
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
        href={`/wallpaper/${wallpaperData.id}/${createSlug(wallpaperData.title)}`}
        className="wallpaper-card-v2-link"
        onClick={handleCardClick}
      >
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

          <div className="wallpaper-card-v2-gradient" />

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

          <div className={`wallpaper-card-v2-top ${isHovered ? "visible" : ""}`}>
            {category && (
              <span className="wallpaper-card-v2-category">
                <Sparkles size={12} />
                {category.name}
              </span>
            )}

            <button
              onClick={handleFavClick}
              disabled={favLoading}
              className={`wallpaper-card-v2-fav ${isFavorited ? "liked" : ""} ${isLikeAnimating ? "animating" : ""}`}
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
            </button>
          </div>

          <div className={`wallpaper-card-v2-bottom ${isHovered ? "expanded" : ""}`}>
            <div className="wallpaper-card-v2-bottom-main">
              <h3 className="wallpaper-card-v2-title">{wallpaperData.title}</h3>
              {wallpaperData.resolution && (
                <span className="wallpaper-card-v2-resolution">{wallpaperData.resolution}</span>
              )}
            </div>

            <div className={`wallpaper-card-v2-bottom-extended ${isHovered ? "visible" : ""}`}>
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

              {showDetailedHover && (
                <div className="wallpaper-card-v2-stats-row">
                  <span className="wallpaper-card-v2-stat-item">
                    <Eye size={14} />
                    <span>{fmtCompact(wallpaperData.views || 0)}</span>
                  </span>
                  <span className="wallpaper-card-v2-stat-item">
                    <Download size={14} />
                    <span>{fmtCompact(wallpaperData.downloads || 0)}</span>
                  </span>
                  <span className="wallpaper-card-v2-stat-item">
                    <Heart size={14} fill={isFavorited ? "currentColor" : "none"} />
                    <span>{fmtCompact(wallpaperData.favorites || 0)}</span>
                  </span>
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
          </div>
        </div>
      </Link>
    </div>
  );
};

export default WallpaperCard;
