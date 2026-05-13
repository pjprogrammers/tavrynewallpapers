"use client";

import { useMemo } from "react";
import { Eye, Download, Heart, Clock } from "lucide-react";
import { useRealtimeWallpaperStats } from "@/lib/use-firestore";
import { Wallpaper } from "../../lib/wallpapers";

interface WallpaperStatsProps {
  wallpaper: Wallpaper;
}

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

export default function WallpaperStats({ wallpaper }: WallpaperStatsProps) {
  // Get real-time stats from Firestore
  const realtimeStats = useRealtimeWallpaperStats(wallpaper.id);

  // Determine what to display - prefer Firestore data if available
  const stats = useMemo(() => {
    if (realtimeStats) {
      return {
        views: realtimeStats.views ?? 0,
        downloads: realtimeStats.downloads ?? 0,
        likes: realtimeStats.likes ?? 0,
        favorites: realtimeStats.favorites ?? 0,
      };
    }
    // Fallback to static data if Firestore stats not yet available
    return {
      views: wallpaper.views ?? 0,
      downloads: wallpaper.downloads ?? 0,
      likes: null, // Static data doesn't have like count
      favorites: null,
    };
  }, [realtimeStats, wallpaper.views, wallpaper.downloads]);

  return (
    <div className="wallpaper-stats-grid">
      <div className="wallpaper-stat-card animate-fade-in" style={{animationDelay: "0.1s"}}>
        <Eye size={18} className="stat-icon" />
        <span className="stat-label">Views</span>
        <span className="stat-value">{formatNumber(stats.views)}</span>
      </div>
      <div className="wallpaper-stat-card animate-fade-in" style={{animationDelay: "0.2s"}}>
        <Download size={18} className="stat-icon" />
        <span className="stat-label">Downloads</span>
        <span className="stat-value">{formatNumber(stats.downloads)}</span>
      </div>
      {stats.likes !== null && (
        <div className="wallpaper-stat-card animate-fade-in" style={{animationDelay: "0.15s"}}>
          <Heart size={18} className="stat-icon" />
          <span className="stat-label">Likes</span>
          <span className="stat-value">{formatNumber(stats.likes)}</span>
        </div>
      )}
      <div className="wallpaper-stat-card animate-fade-in" style={{animationDelay: "0.3s"}}>
        <Clock size={18} className="stat-icon" />
        <span className="stat-label">Uploaded</span>
        <span className="stat-value">{new Date(wallpaper.uploadDate).toLocaleDateString()}</span>
      </div>
    </div>
  );
}