"use client";

import { useMemo } from "react";
import { Info, Download, Eye, Heart } from "lucide-react";
import { useRealtimeWallpaperStats } from "@/lib/use-firestore";
import { getCategoryById } from "../../lib/wallpapers";

interface WallpaperInfoCardProps {
  wallpaperId: string;
  categoryId: string;
  resolution?: string;
  uploadDate: string;
  staticViews: number;
  staticDownloads: number;
}

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

export default function WallpaperInfoCard({
  wallpaperId,
  categoryId,
  resolution,
  uploadDate,
  staticViews,
  staticDownloads,
}: WallpaperInfoCardProps) {
  const realtimeStats = useRealtimeWallpaperStats(wallpaperId);

  const stats = useMemo(() => {
    if (realtimeStats) {
      return {
        views: realtimeStats.views ?? 0,
        downloads: realtimeStats.downloads ?? 0,
        likes: realtimeStats.likes ?? 0,
      };
    }
    return {
      views: staticViews,
      downloads: staticDownloads,
      likes: null,
    };
  }, [realtimeStats, staticViews, staticDownloads]);

  const category = getCategoryById(categoryId);

  return (
    <div className="wallpaper-info-card animate-fade-in" style={{animationDelay: "0.4s"}}>
      <div className="info-card-header">
        <Info size={18} className="info-icon" />
        <h3 className="info-title">Details</h3>
      </div>
      <div className="info-grid">
        <div className="info-label">Category:</div>
        <div className="info-value">{category?.name || 'Uncategorized'}</div>

        {resolution && (
          <>
            <div className="info-label">Resolution:</div>
            <div className="info-value">{resolution}</div>
          </>
        )}

        <div className="info-label">Uploaded:</div>
        <div className="info-value">{new Date(uploadDate).toLocaleDateString()}</div>

        <div className="info-label">Downloads:</div>
        <div className="info-value">{formatNumber(stats.downloads)}</div>

        <div className="info-label">Views:</div>
        <div className="info-value">{formatNumber(stats.views)}</div>

        {stats.likes !== null && (
          <>
            <div className="info-label">Likes:</div>
            <div className="info-value">{formatNumber(stats.likes)}</div>
          </>
        )}

        <div className="info-label">ID:</div>
        <div className="info-value">{wallpaperId}</div>
      </div>
    </div>
  );
}