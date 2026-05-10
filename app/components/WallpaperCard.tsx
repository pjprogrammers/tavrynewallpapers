"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Heart, Eye } from "lucide-react";

import {
  Wallpaper,
  getCategoryById
} from "../lib/wallpapers";

interface WallpaperCardProps {
  wallpaper?: Wallpaper;
  id?: string;
  title?: string;
  imageSrc?: string;
  author?: string;
  likes?: number;
  downloads?: number;
  category?: string;
  priority?: boolean;
  className?: string;
}

const WallpaperCard = ({
  wallpaper,
  id,
  title,
  imageSrc,
  author,
  likes,
  downloads,
  category: categoryProp,
  priority = false,
  className = ""
}: WallpaperCardProps) => {

  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Safe wallpaper object
  const wallpaperData: Wallpaper = wallpaper || {
    id: id || "",
    title: title || "",
    filename: imageSrc?.split("/").pop() || "",
    slug: (title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-"),
    categoryId: (categoryProp || "").toLowerCase(),
    tags: [],
    views: likes || 0,
    downloads: downloads || 0,
    featured: true,
    trending: true,
    uploadDate: new Date()
      .toISOString()
      .split("T")[0],
    resolution: "3840x2160"
  };

  const category = getCategoryById(
    wallpaperData.categoryId
  );

  const handleLike = (
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLiked(!isLiked);
  };

  const handleDownload = (
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    window.open(
      `/wallpapers/${wallpaperData.filename}`,
      "_blank"
    );
  };

  const formatStats = (
    num: number
  ): string => {

    if (num >= 1000000) {
      return Math.floor(num / 1000000) + "M";
    }

    if (num >= 1000) {
      return Math.floor(num / 1000) + "K";
    }

    return num.toString();
  };

  return (
    <div
      className={`card-wallpaper animate-fade-in ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      <Link
        href={`/wallpaper/${wallpaperData.slug}`}
        className="card-wallpaper-link"
      >

        <div className="card-wallpaper-image-wrapper">

          <Image
            src={`/wallpapers/${wallpaperData.filename}`}
            alt={wallpaperData.title}
            fill
            className={`card-wallpaper-image ${
              isLoading
                ? "loading"
                : "loaded"
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={priority}
            onLoad={() => setIsLoading(false)}
          />

          {/* Overlay */}
          <div
            className={`card-wallpaper-overlay ${
              isHovered
                ? "active"
                : ""
            }`}
          >

            <div className="card-wallpaper-top">

              {category && (
                <span className="card-wallpaper-category animate-float">
                  {category.name}
                </span>
              )}

              <button
                onClick={handleLike}
                className={`card-wallpaper-like-button ${
                  isLiked
                    ? "liked"
                    : ""
                }`}
              >
                <Heart
                  size={18}
                  className={
                    isLiked
                      ? "animate-pop"
                      : ""
                  }
                />
              </button>

            </div>

            <div className="card-wallpaper-bottom">

              <h3 className="card-wallpaper-title">
                {wallpaperData.title}
              </h3>

              {wallpaperData.resolution && (
                <span className="card-wallpaper-resolution">
                  {wallpaperData.resolution}
                </span>
              )}

              <button
                onClick={handleDownload}
                className="card-wallpaper-download-button animate-pulse-subtle"
              >
                <Download size={16} />
                <span>Download</span>
              </button>

            </div>
          </div>
        </div>
      </Link>

      {/* Stats */}
      <div
        className={`card-wallpaper-stats ${
          isHovered
            ? "hidden"
            : ""
        }`}
      >

        <div className="card-wallpaper-stat">
          <Eye size={14} />
          <span>
            {formatStats(wallpaperData.views)}
          </span>
        </div>

        <div className="card-wallpaper-stat">
          <Download size={14} />
          <span>
            {formatStats(
              wallpaperData.downloads
            )}
          </span>
        </div>

        <div className="card-wallpaper-stat">

          <Heart
            size={14}
            className={
              isLiked
                ? "heart-icon-filled animate-beat"
                : ""
            }
            fill={
              isLiked
                ? "var(--heart)"
                : "none"
            }
          />

          <span>
            {formatStats(
              isLiked
                ? wallpaperData.downloads + 1
                : wallpaperData.downloads
            )}
          </span>

        </div>
      </div>
    </div>
  );
};

export default WallpaperCard;