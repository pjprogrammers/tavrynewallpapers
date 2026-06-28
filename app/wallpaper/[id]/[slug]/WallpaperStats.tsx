"use client";

import { Eye, Download, Heart, Clock, MousePointer, EyeOff } from "lucide-react";
import { Wallpaper } from "../../../lib/wallpapers";
import { formatNumber } from "@/lib/format";

interface WallpaperStatsProps {
  wallpaper: Wallpaper;
}

export default function WallpaperStats({ wallpaper }: WallpaperStatsProps) {
  return (
    <div className="wallpaper-stats-grid">
      <div className="wallpaper-stat-card animate-fade-in" style={{animationDelay: "0.1s"}}>
        <Eye size={18} className="stat-icon" />
        <span className="stat-label">Views</span>
        <span className="stat-value">{formatNumber(wallpaper.views ?? 0)}</span>
      </div>
      <div className="wallpaper-stat-card animate-fade-in" style={{animationDelay: "0.2s"}}>
        <Download size={18} className="stat-icon" />
        <span className="stat-label">Downloads</span>
        <span className="stat-value">{formatNumber(wallpaper.downloads ?? 0)}</span>
      </div>
      <div className="wallpaper-stat-card animate-fade-in" style={{animationDelay: "0.15s"}}>
        <Heart size={18} className="stat-icon" />
        <span className="stat-label">Favorites</span>
        <span className="stat-value">{formatNumber(wallpaper.favorites ?? 0)}</span>
      </div>
      <div className="wallpaper-stat-card animate-fade-in" style={{animationDelay: "0.25s"}}>
        <EyeOff size={18} className="stat-icon" />
        <span className="stat-label">Impressions</span>
        <span className="stat-value">{formatNumber(wallpaper.impressions ?? 0)}</span>
      </div>
      <div className="wallpaper-stat-card animate-fade-in" style={{animationDelay: "0.35s"}}>
        <MousePointer size={18} className="stat-icon" />
        <span className="stat-label">Clicks</span>
        <span className="stat-value">{formatNumber(wallpaper.clicks ?? 0)}</span>
      </div>
      <div className="wallpaper-stat-card animate-fade-in" style={{animationDelay: "0.3s"}}>
        <Clock size={18} className="stat-icon" />
        <span className="stat-label">Uploaded</span>
        <span className="stat-value">{new Date(wallpaper.uploadDate ?? Date.now()).toLocaleDateString()}</span>
      </div>
    </div>
  );
}