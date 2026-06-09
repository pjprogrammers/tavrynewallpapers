"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Download,
  Share2,
  ChevronDown,
  Check,
  Loader2,
  Monitor,
  Laptop,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLike, useViewCount, useDownload, useRealtimeWallpaperStats } from "@/lib/use-firestore";
import { Wallpaper } from "../../lib/wallpapers";
import { resolveImageUrl, resolveThumbnailUrl } from "@/lib/wallpaper-image";

interface WallpaperActionsProps {
  wallpaper: Wallpaper;
  downloadOptions: {
    name: string;
    resolution: string;
    device: string;
    icon: string;
  }[];
}

export default function WallpaperActions({ wallpaper, downloadOptions }: WallpaperActionsProps) {
  const { user } = useAuth();
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Track view when wallpaper page loads
  useViewCount(wallpaper.id);

  // Use Firestore for likes (auto-syncs with favorites)
  const { isLiked, loading: likeLoading, error: likeError, toggle: toggleLike } = useLike(
    wallpaper.id,
    {
      slug: wallpaper.slug,
      title: wallpaper.title,
      thumbnail: resolveThumbnailUrl(wallpaper) ?? `/wallpapers/${wallpaper.filename}`,
    }
  );

  // Download hook
  const { download: recordAndDownload, error: downloadError } = useDownload(wallpaper.id, wallpaper.slug);

  // Get real-time stats for like count
  const realtimeStats = useRealtimeWallpaperStats(wallpaper.id);

  const handleLike = async () => {
    if (!user) {
      alert("Please sign in to like wallpapers");
      return;
    }
    await toggleLike();
    if (likeError) {
      setRateLimitError(likeError);
      setTimeout(() => setRateLimitError(null), 5000);
    }
  };

  const downloadImage = async (imageUrl: string, fileName: string) => {
    setIsDownloading(true);
    setRateLimitError(null);

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
      setTimeout(() => setShowDownloadOptions(false), 1000);
    }
  };

  const handleDownload = async (resolution: string = wallpaper.resolution || "Original", deviceType: "monitor" | "laptop" | "smartphone" | "original" = "original") => {
    const fileName = `${wallpaper.title.replace(/\s+/g, '_')}_${resolution}.jpg`;

    // Record download to Firestore - works for all users (auth or anonymous)
    // Pass user.uid only if logged in, otherwise it's undefined
    const userId = user?.uid;

    try {
      // Use direct Firestore call for anonymous downloads
      const { recordDownload } = await import("@/lib/firestore");
      await recordDownload({
        userId: userId || undefined,
        wallpaperId: wallpaper.id,
        wallpaperSlug: wallpaper.slug,
        resolution,
        deviceType,
      });
    } catch (error) {
      console.error("[Download] Failed to record:", error);
      // Continue with download even if recording fails
    }

    downloadImage(resolveImageUrl(wallpaper) ?? `/wallpapers/${wallpaper.filename}`, fileName);
    setSelectedResolution(resolution);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: wallpaper.title,
        text: `Check out this amazing wallpaper: ${wallpaper.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(console.error);
    }
  };

  // Helper to get the right icon component
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Monitor": return Monitor;
      case "Laptop": return Laptop;
      case "Smartphone": return Smartphone;
      default: return Monitor;
    }
  };

  // Helper to get device type from icon name
  const getDeviceType = (iconName: string): "monitor" | "laptop" | "smartphone" | "original" => {
    switch (iconName) {
      case "Monitor": return "monitor";
      case "Laptop": return "laptop";
      case "Smartphone": return "smartphone";
      default: return "original";
    }
  };

  return (
    <div className="wallpaper-actions">
      <div className="wallpaper-action-buttons">
        <button
          onClick={handleLike}
          className={`wallpaper-action-button ${isLiked ? 'active' : ''}`}
          disabled={likeLoading}
          title={isLiked ? "Unlike" : "Like this wallpaper"}
        >
          <Heart
            size={20}
            className={`action-icon ${isLiked ? 'animate-pop' : ''}`}
            fill={isLiked ? "var(--heart)" : "none"}
          />
          <span>{isLiked ? 'Liked' : 'Like'}{realtimeStats?.likes ? ` (${realtimeStats.likes})` : ''}</span>
        </button>

        <button onClick={handleShare} className="wallpaper-action-button">
          <Share2 size={20} className="action-icon" />
          <span>Share</span>
        </button>
      </div>

      {/* Download dropdown */}
      <div className="wallpaper-download-container">
        <button
          onClick={() => setShowDownloadOptions(!showDownloadOptions)}
          className={`wallpaper-download-button ${showDownloadOptions ? 'active' : ''}`}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : downloadSuccess ? (
            <Check size={20} className="animate-pop" />
          ) : (
            <Download size={20} />
          )}
          <span>{isDownloading ? 'Downloading...' : downloadSuccess ? 'Downloaded!' : 'Download'}</span>
          <ChevronDown
            size={16}
            className={`chevron-icon ${showDownloadOptions ? 'rotate' : ''}`}
          />
        </button>

        <div className={`wallpaper-download-dropdown ${showDownloadOptions ? 'show' : ''}`}>
          <div className="dropdown-header">
            <h3 className="dropdown-title">Download Options</h3>
            <p className="dropdown-subtitle">Select resolution</p>
          </div>
          <div className="dropdown-options">
            {downloadOptions.map((option) => {
              const IconComponent = getIconComponent(option.icon);
              const deviceType = getDeviceType(option.icon);
              return (
                <button
                  key={option.resolution}
                  className={`dropdown-option ${selectedResolution === option.resolution ? 'selected' : ''}`}
                  onClick={() => handleDownload(option.resolution, deviceType)}
                >
                  <div className="dropdown-option-icon">
                    <IconComponent size={18} />
                  </div>
                  <div className="dropdown-option-text">
                    <p className="dropdown-option-name">{option.name}</p>
                    <p className="dropdown-option-resolution">{option.resolution}</p>
                  </div>
                  {selectedResolution === option.resolution && (
                    <Check size={16} className="dropdown-check-icon" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
