"use client";

import { useState } from "react";
import { 
  Heart, 
  Download, 
  Share2,
  ChevronDown, 
  Check, 
  Loader2,
  Monitor,
  Laptop,
  Smartphone
} from "lucide-react";
import { Wallpaper } from "../../lib/wallpapers";

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
  const [isLiked, setIsLiked] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };
  
  const downloadImage = async (imageUrl: string, fileName: string) => {
    setIsDownloading(true);
    
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
  
  const handleDownload = (resolution: string = wallpaper.resolution || "Original") => {
    const fileName = `${wallpaper.title.replace(/\s+/g, '_')}_${resolution}.jpg`;
    downloadImage(`/wallpapers/${wallpaper.filename}`, fileName);
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
  
  return (
    <div className="wallpaper-actions">
      <div className="wallpaper-action-buttons">
        <button onClick={handleLike} className={`wallpaper-action-button ${isLiked ? 'active' : ''}`}>
          <Heart 
            size={20} 
            className={`action-icon ${isLiked ? 'animate-pop' : ''}`}
            fill={isLiked ? "var(--heart)" : "none"}
          />
          <span>Like</span>
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
              return (
                <button
                  key={option.resolution}
                  className={`dropdown-option ${selectedResolution === option.resolution ? 'selected' : ''}`}
                  onClick={() => handleDownload(option.resolution)}
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