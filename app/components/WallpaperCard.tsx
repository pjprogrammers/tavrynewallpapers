"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Heart, Eye } from "lucide-react";
import { Wallpaper, getCategoryById } from "../lib/wallpapers";

interface WallpaperCardProps {
  wallpaper: Wallpaper;
  priority?: boolean;
  className?: string;
}

const WallpaperCard = ({ wallpaper, priority = false, className = "" }: WallpaperCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const category = getCategoryById(wallpaper.categoryId);
  
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };
  
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`/wallpapers/${wallpaper.filename}`, '_blank');
  };
  
  const formatStats = (num: number): string => {
    if (num >= 1000000) {
      return Math.floor(num / 1000000) + 'M';
    }
    if (num >= 1000) {
      return Math.floor(num / 1000) + 'K';
    }
    return num.toString();
  };

  return (
    <div 
      className={`card-wallpaper animate-fade-in ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/wallpaper/${wallpaper.slug}`} className="card-wallpaper-link">
        <div className="card-wallpaper-image-wrapper">
          <Image
            src={`/wallpapers/${wallpaper.filename}`}
            alt={wallpaper.title}
            fill
            className={`card-wallpaper-image ${isLoading ? 'loading' : 'loaded'}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={priority}
            onLoad={() => setIsLoading(false)}
          />
          
          {/* Overlay */}
          <div className={`card-wallpaper-overlay ${isHovered ? 'active' : ''}`}>
            <div className="card-wallpaper-top">
              {category && (
                <span className="card-wallpaper-category animate-float">{category.name}</span>
              )}
              <button 
                onClick={handleLike} 
                className={`card-wallpaper-like-button ${isLiked ? 'liked' : ''}`}
              >
                <Heart size={18} className={isLiked ? 'animate-pop' : ''} />
              </button>
            </div>
            
            <div className="card-wallpaper-bottom">
              <h3 className="card-wallpaper-title">{wallpaper.title}</h3>
              {wallpaper.resolution && (
                <span className="card-wallpaper-resolution">{wallpaper.resolution}</span>
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
      
      {/* Stats bar (visible when not hovered) */}
      <div className={`card-wallpaper-stats ${isHovered ? 'hidden' : ''}`}>
        <div className="card-wallpaper-stat">
          <Eye size={14} />
          <span>{formatStats(wallpaper.views)}</span>
        </div>
        <div className="card-wallpaper-stat">
          <Download size={14} />
          <span>{formatStats(wallpaper.downloads)}</span>
        </div>
        <div className="card-wallpaper-stat">
          <Heart 
            size={14} 
            className={isLiked ? 'heart-icon-filled animate-beat' : ''}
            fill={isLiked ? "var(--heart)" : "none"}
          />
          <span>{formatStats(isLiked ? wallpaper.downloads + 1 : wallpaper.downloads)}</span>
        </div>
      </div>
    </div>
  );
};

export default WallpaperCard; 