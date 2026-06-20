"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Download, Eye, Sparkles } from "lucide-react";
import { createSlug } from "@/lib/slug";
import { resolveThumbnailUrl, resolveImageUrl } from "@/lib/wallpaper-image";
import { useAuth } from "@/lib/auth-context";
import { useFavorite, useDownload } from "@/lib/use-firestore";
import { getRecencyBadge } from "@/lib/wallpaper-time";
import { getCategoryById } from "@/lib/category-store";
import { Wallpaper } from "../lib/wallpapers";
import { hashIdToColor } from "@/lib/masonry-engine";
import type { MasonryPosition } from "@/lib/masonry-engine";
import type { CategoryDoc } from "@/lib/firestore-types";

const formatNumber = (num: number): string => {
  if (num >= 1000000) return Math.floor(num / 1000000) + "M";
  if (num >= 1000) return Math.floor(num / 1000) + "K";
  return num.toString();
};

interface MasonryCardProps {
  wallpaper: Wallpaper;
  position: MasonryPosition;
  priority?: boolean;
}

export default function MasonryCard({
  wallpaper,
  position,
  priority = false,
}: MasonryCardProps) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [category, setCategory] = useState<CategoryDoc | null>(null);
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(hover: none)").matches);
  }, []);

  useEffect(() => {
    getCategoryById(wallpaper.categoryId).then(setCategory);
  }, [wallpaper.categoryId]);

  const { isFavorited, loading: favLoading, toggle: toggleFav } = useFavorite(
    wallpaper.id,
    {
      slug: wallpaper.slug,
      title: wallpaper.title,
      thumbnail: resolveThumbnailUrl(wallpaper) ?? "",
    }
  );

  const { download: recordAndDownload } = useDownload(wallpaper.id, wallpaper.slug);

  const placeholderColor = useMemo(
    () => hashIdToColor(wallpaper.id),
    [wallpaper.id]
  );

  const handleFavClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
        alert("Please sign in to favorite wallpapers");
        return;
      }
      setIsLikeAnimating(true);
      await toggleFav();
      setTimeout(() => setIsLikeAnimating(false), 500);
    },
    [user, toggleFav]
  );

  const handleDownloadClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const imgUrl =
        resolveImageUrl(wallpaper) ?? `/wallpapers/${wallpaper.filename}`;
      await recordAndDownload(
        wallpaper.resolution || "3840x2160",
        "original"
      );
      const link = document.createElement("a");
      link.href = `/api/download?url=${encodeURIComponent(imgUrl)}&filename=${wallpaper.slug}.jpg`;
      link.download = `${wallpaper.slug}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    [wallpaper, recordAndDownload]
  );

  // Suppress navigation during scroll (otherwise let Link navigate to detail page)
  const handleLinkClick = useCallback((e: React.MouseEvent) => {
    const grid = (e.currentTarget as HTMLElement).closest(".is-scrolling");
    if (grid) {
      e.preventDefault();
    }
  }, []);

  // Touch handlers: long-press triggers save
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = window.setTimeout(async () => {
      if (!user) {
        alert("Please sign in to favorite wallpapers");
        return;
      }
      if (!isFavorited && !favLoading) {
        setIsLikeAnimating(true);
        await toggleFav();
        setTimeout(() => setIsLikeAnimating(false), 500);
      }
    }, 500);
  }, [user, isFavorited, favLoading, toggleFav]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const recencyBadge = getRecencyBadge(wallpaper);

  return (
    <Link
      href={`/wallpaper/${wallpaper.id}/${createSlug(wallpaper.title)}`}
      className={`masonry-card ${isTouchDevice ? "touch-device" : ""} ${isHovered ? "hovered" : ""}`}
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
        width: position.width,
        height: position.height,
      }}
      onMouseEnter={() => !isTouchDevice && setIsHovered(true)}
      onMouseLeave={() => !isTouchDevice && setIsHovered(false)}
      onClick={handleLinkClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <div
        className={`masonry-card-image ${imageLoaded ? "loaded" : ""}`}
        style={{ backgroundColor: placeholderColor }}
      >
        <Image
          src={
            resolveThumbnailUrl(wallpaper) ??
            `/wallpapers/${wallpaper.filename}`
          }
          alt={wallpaper.title}
          fill
          sizes="(max-width: 480px) 50vw, (max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className={`masonry-card-img ${imageLoaded ? "loaded" : ""}`}
          priority={priority}
          onLoad={() => setImageLoaded(true)}
        />
        {!imageLoaded && (
          <div
            className="masonry-card-blur"
            style={{ backgroundColor: placeholderColor }}
          />
        )}
      </div>

      {/* Top overlay — category badge + save button on hover */}
      {isHovered && (
        <div className="masonry-card-overlay visible">
          <div className="masonry-card-top-bar">
            {category && (
              <span className="masonry-card-category-badge">
                <Sparkles size={10} />
                {category.name}
              </span>
            )}
            <button
              onClick={handleFavClick}
              disabled={favLoading}
              className={`masonry-card-heart-btn ${isFavorited ? "liked" : ""} ${isLikeAnimating ? "animating" : ""}`}
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                size={16}
                fill={isFavorited ? "currentColor" : "none"}
              />
            </button>
          </div>
        </div>
      )}

      {/* Bottom details panel — compact hover info */}
      {isHovered && (
        <div className="masonry-card-details">
          {wallpaper.tags && wallpaper.tags.length > 0 && (
            <div className="masonry-card-tags">
              {wallpaper.tags.slice(0, 3).map((tag, idx) => (
                <span key={`${tag}-${idx}`} className="masonry-card-tag">{tag}</span>
              ))}
              {wallpaper.tags.length > 3 && (
                <span className="masonry-card-tag-more">+{wallpaper.tags.length - 3}</span>
              )}
            </div>
          )}

          <div className="masonry-card-info-row">
            {wallpaper.resolution && (
              <span className="masonry-card-resolution">{wallpaper.resolution}</span>
            )}
            <span className="masonry-card-stat-item">
              <Eye size={11} />
              {formatNumber(wallpaper.views ?? 0)}
            </span>
            <span className="masonry-card-stat-item">
              <Download size={11} />
              {formatNumber(wallpaper.downloads ?? 0)}
            </span>
            <span className="masonry-card-stat-item">
              <Heart size={11} fill={isFavorited ? "currentColor" : "none"} />
              {formatNumber(wallpaper.favorites ?? 0)}
            </span>
            <button
              onClick={handleDownloadClick}
              className="masonry-card-download-icon"
              title="Download"
            >
              <Download size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Touch device — mini always-visible save button */}
      {isTouchDevice && (
        <button
          onClick={handleFavClick}
          disabled={favLoading}
          className={`masonry-card-save-mini ${isFavorited ? "saved" : ""}`}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={14} fill={isFavorited ? "currentColor" : "none"} />
        </button>
      )}

      {/* Footer — title + recency badge (hidden on hover) */}
      <div className="masonry-card-footer">
        {!isHovered && (
          <>
            <h3 className="masonry-card-title">{wallpaper.title}</h3>
            {recencyBadge && (
              <span
                className={`masonry-card-recency masonry-card-recency-${recencyBadge}`}
              >
                <Sparkles size={10} />
                {recencyBadge === "new" ? "New" : "Updated"}
              </span>
            )}
          </>
        )}
      </div>
    </Link>
  );
}
