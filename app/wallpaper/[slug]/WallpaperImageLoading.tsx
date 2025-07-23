"use client";

import { useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";

export default function WallpaperImageLoading() {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress for the image
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const next = prev + Math.random() * 10;
        return next > 100 ? 100 : next;
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="wallpaper-image-loading">
      <div className="loading-icon-container">
        <ImageIcon size={40} className="loading-icon animate-pulse" />
        <div className="loading-progress-track">
          <div 
            className="loading-progress-bar" 
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
        <span className="loading-percentage">{Math.round(loadingProgress)}%</span>
      </div>
    </div>
  );
} 