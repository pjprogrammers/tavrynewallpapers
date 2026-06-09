"use client";

import { useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";

export default function WallpaperImageLoading() {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress for the image. The previous
    // implementation kept the interval running forever and never
    // capped the progress value, which produced a constant
    // re-render storm. We now stop the interval once we reach
    // 100 and also stop scheduling more work if the component
    // is unmounted.
    let cancelled = false;
    let value = 0;
    const interval = setInterval(() => {
      if (cancelled) return;
      // Bump by a small amount and clamp to 100 so we eventually
      // stop the interval cleanly.
      value = Math.min(100, value + 5 + Math.random() * 8);
      setLoadingProgress(value);
      if (value >= 100) {
        clearInterval(interval);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
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
