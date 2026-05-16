"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, ExternalLink, Monitor, Laptop, Smartphone, Calendar, HardDrive } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserDownloads } from "@/lib/use-firestore";
import type { Download as DownloadRecord } from "@/lib/firestore-types";

const deviceIcons = {
  monitor: Monitor,
  laptop: Laptop,
  smartphone: Smartphone,
  original: Download,
};

const deviceLabels = {
  monitor: "Desktop",
  laptop: "Laptop",
  smartphone: "Mobile",
  original: "Original",
};

export const DownloadsContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { downloads, loading: downloadsLoading } = useUserDownloads();

  if (authLoading || downloadsLoading) {
    return (
      <div className="downloads-page" style={{ minHeight: "60vh" }}>
        <div className="page-header">
          <h1>Your Downloads</h1>
          <p>Loading...</p>
        </div>
        <div className="cards-grid-skeleton">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-required">
        <Download size={64} className="icon-large" />
        <h1>Sign in to view your downloads</h1>
        <p>Create an account or sign in to track your download history.</p>
        <div className="auth-buttons">
          <Link href="/login" className="btn btn-primary">
            Sign In
          </Link>
          <Link href="/signup" className="btn btn-secondary">
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  if (downloads.length === 0) {
    return (
      <div className="empty-state">
        <Download size={64} className="icon-large" />
        <h1>No downloads yet</h1>
        <p>Start downloading wallpapers and track your history here!</p>
        <Link href="/" className="btn btn-primary">
          Browse Wallpapers
        </Link>
      </div>
    );
  }

  // Group downloads by wallpaper
  const groupedDownloads = downloads.reduce((acc, download) => {
    const key = download.wallpaperId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(download);
    return acc;
  }, {} as Record<string, DownloadRecord[]>);

  return (
    <div className="downloads-page">
      <div className="page-header">
        <h1>Your Downloads</h1>
        <p>{downloads.length} download{downloads.length !== 1 ? "s" : ""} recorded</p>
      </div>

      <div className="cards-grid">
        {Object.entries(groupedDownloads).map(([wallpaperId, wallpaperDownloads], index) => (
          <DownloadCard
            key={wallpaperId}
            wallpaperId={wallpaperId}
            downloads={wallpaperDownloads}
            priority={index < 4}
          />
        ))}
      </div>
    </div>
  );
};

interface DownloadCardProps {
  wallpaperId: string;
  downloads: DownloadRecord[];
  priority?: boolean;
}

const DownloadCard = ({ wallpaperId, downloads, priority = false }: DownloadCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const latestDownload = downloads[0];

  const downloadDate = latestDownload.downloadedAt instanceof Date
    ? latestDownload.downloadedAt
    : new Date((latestDownload.downloadedAt as any).seconds * 1000);

  const formattedDate = downloadDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Get unique resolutions and device types
  const resolutions = [...new Set(downloads.map((d) => d.resolution))];
  const deviceTypes = [...new Set(downloads.map((d) => d.deviceType))];

  return (
    <div
      className="glass-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/wallpaper/${latestDownload.wallpaperSlug}`} className="glass-card-link">
        {/* Background Image */}
        <div className="glass-card-image">
          <Image
            src={`/wallpapers/${wallpaperId}.jpg`}
            alt={latestDownload.wallpaperSlug}
            fill
            className={`glass-card-img ${isHovered ? "blurred" : ""}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
          />
        </div>

        {/* Glass Overlay */}
        <div className={`glass-card-overlay ${isHovered ? "active" : ""}`}>
          <div className="glass-card-content">
            <div className="glass-card-header">
              <h3 className="glass-card-title">
                {latestDownload.wallpaperSlug.replace(/-/g, " ")}
              </h3>
            </div>

            <div className="glass-card-meta">
              <span className="glass-card-meta-item">
                <Calendar size={14} />
                {formattedDate}
              </span>
              <span className="glass-card-meta-item">
                <HardDrive size={14} />
                Downloaded {downloads.length}x
              </span>
            </div>

            <div className="glass-card-tags">
              {resolutions.map((res) => (
                <span key={res} className="glass-card-tag">
                  {res}
                </span>
              ))}
              {deviceTypes.map((type) => {
                const Icon = deviceIcons[type];
                return (
                  <span key={type} className="glass-card-tag glass-card-tag-icon" title={deviceLabels[type]}>
                    <Icon size={12} />
                  </span>
                );
              })}
            </div>

            <div className="glass-card-actions">
              <button className="glass-card-btn glass-card-btn-primary">
                <Download size={18} />
                Download Again
              </button>
            </div>
          </div>
        </div>

        {/* Default Info (shown when not hovering) */}
        <div className={`glass-card-default ${isHovered ? "hidden" : ""}`}>
          <Download size={20} className="glass-card-default-icon" />
          <span className="glass-card-default-title">
            {latestDownload.wallpaperSlug.replace(/-/g, " ")}
          </span>
        </div>
      </Link>
    </div>
  );
};

export default DownloadsContent;
