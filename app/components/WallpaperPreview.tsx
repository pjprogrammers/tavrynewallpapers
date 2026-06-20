"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Heart, Download, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { createSlug } from "@/lib/slug";
import { resolveImageUrl } from "@/lib/wallpaper-image";
import { useAuth } from "@/lib/auth-context";
import { useFavorite, useDownload } from "@/lib/use-firestore";
import { hashIdToColor } from "@/lib/masonry-engine";
import { Wallpaper } from "../lib/wallpapers";

const EXIT_MS = 220;

interface WallpaperPreviewProps {
  wallpaper: Wallpaper;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export default function WallpaperPreview({
  wallpaper,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: WallpaperPreviewProps) {
  const { user } = useAuth();
  const [backdropVisible, setBackdropVisible] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const exitTimerRef = useRef<number | null>(null);

  const { isFavorited, loading: favLoading, toggle: toggleFav } = useFavorite(
    wallpaper.id,
    {
      slug: wallpaper.slug,
      title: wallpaper.title,
      thumbnail: resolveImageUrl(wallpaper) ?? "",
    }
  );

  const { download: recordAndDownload } = useDownload(wallpaper.id, wallpaper.slug);

  const imgUrl = resolveImageUrl(wallpaper) ?? `/wallpapers/${wallpaper.filename}`;
  const placeholderColor = hashIdToColor(wallpaper.id);

  // Entrance: reveal backdrop on next frame so CSS transition fires
  useEffect(() => {
    const frame = requestAnimationFrame(() => setBackdropVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Image decode → ready (re-triggers on wallpaper change for prev/next)
  useEffect(() => {
    setImageReady(false);
    const img = new window.Image();
    let cancelled = false;
    img.onload = () => { if (!cancelled) setImageReady(true); };
    img.onerror = () => { if (!cancelled) setImageReady(true); };
    img.src = imgUrl;
    const fallback = setTimeout(() => {
      if (!cancelled) setImageReady(true);
    }, 2000);
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
      clearTimeout(fallback);
    };
  }, [imgUrl]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  const handleClose = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setBackdropVisible(false);
    exitTimerRef.current = window.setTimeout(() => onClose(), EXIT_MS);
  }, [onClose, exiting]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (exiting) return;
      switch (e.key) {
        case "Escape":
          handleClose();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (hasPrev && onPrev) onPrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (hasNext && onNext) onNext();
          break;
      }
    },
    [handleClose, onPrev, onNext, hasPrev, hasNext, exiting]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) handleClose();
    },
    [handleClose]
  );

  const handleFavClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) { alert("Please sign in to favorite wallpapers"); return; }
      setIsLikeAnimating(true);
      await toggleFav();
      setTimeout(() => setIsLikeAnimating(false), 500);
    },
    [user, toggleFav]
  );

  const handleDownloadClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await recordAndDownload(wallpaper.resolution || "3840x2160", "original");
      const link = document.createElement("a");
      link.href = `/api/download?url=${encodeURIComponent(imgUrl)}&filename=${wallpaper.slug}.jpg`;
      link.download = `${wallpaper.slug}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    [wallpaper, recordAndDownload, imgUrl]
  );

  // Prevent iOS swipe-back gesture while preview is open
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      // If swiping from left edge, prevent default to stop swipe-back
      if (touch.clientX < 30) e.preventDefault();
    },
    []
  );

  useEffect(() => {
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    return () => window.removeEventListener("touchstart", handleTouchStart);
  }, [handleTouchStart]);

  const showImage = imageReady || exiting;

  return (
    <div
      ref={overlayRef}
      className={`wallpaper-preview-overlay ${backdropVisible ? "visible" : ""} ${exiting ? "exiting" : ""}`}
      onClick={handleBackdropClick}
    >
      <button
        className={`wallpaper-preview-close ${imageReady ? "ready" : ""}`}
        onClick={handleClose}
        aria-label="Close preview"
      >
        <X size={24} />
      </button>

      {hasPrev && onPrev && (
        <button
          className={`wallpaper-preview-nav wallpaper-preview-nav-prev ${imageReady ? "ready" : ""}`}
          onClick={onPrev}
          aria-label="Previous wallpaper"
        >
          <ChevronLeft size={28} />
        </button>
      )}
      {hasNext && onNext && (
        <button
          className={`wallpaper-preview-nav wallpaper-preview-nav-next ${imageReady ? "ready" : ""}`}
          onClick={onNext}
          aria-label="Next wallpaper"
        >
          <ChevronRight size={28} />
        </button>
      )}

      <div className={`wallpaper-preview-image-wrapper ${imageReady ? "ready" : ""}`}>
        <div className={`wallpaper-preview-image-container ${showImage ? "ready" : ""}`}>
          {showImage && (
            <Image
              src={imgUrl}
              alt={wallpaper.title}
              fill
              className="wallpaper-preview-image"
              sizes="100vw"
              priority
              style={{ backgroundColor: placeholderColor }}
            />
          )}
          {!imageReady && !exiting && (
            <div
              className="wallpaper-preview-placeholder"
              style={{ backgroundColor: placeholderColor }}
            />
          )}
        </div>
      </div>

      <div className={`wallpaper-preview-bar ${imageReady ? "ready" : ""}`}>
        <div className="wallpaper-preview-info">
          <h2 className="wallpaper-preview-title">{wallpaper.title}</h2>
          <span className="wallpaper-preview-category">{wallpaper.categoryId}</span>
          {wallpaper.resolution && (
            <span className="wallpaper-preview-resolution">{wallpaper.resolution}</span>
          )}
        </div>
        <div className="wallpaper-preview-actions">
          <button
            onClick={handleFavClick}
            disabled={favLoading}
            className={`wallpaper-preview-action ${isFavorited ? "favorited" : ""} ${isLikeAnimating ? "animating" : ""}`}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={20} fill={isFavorited ? "currentColor" : "none"} />
          </button>
          <button
            onClick={handleDownloadClick}
            className="wallpaper-preview-action"
            title="Download"
          >
            <Download size={20} />
          </button>
          <Link
            href={`/wallpaper/${wallpaper.id}/${createSlug(wallpaper.title)}`}
            className="wallpaper-preview-details"
            onClick={handleClose}
          >
            <ExternalLink size={16} />
            <span>View Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
