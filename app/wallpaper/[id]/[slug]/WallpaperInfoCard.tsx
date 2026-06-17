"use client";

import { Info, Download, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { getCategoryById } from "@/lib/category-store";
import type { CategoryDoc } from "@/lib/firestore-types";

interface WallpaperInfoCardProps {
  wallpaperId: string;
  categoryId: string;
  resolution?: string;
  uploadDate?: string;
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
  uploadDate = "",
  staticViews,
  staticDownloads,
}: WallpaperInfoCardProps) {
  const [category, setCategory] = useState<CategoryDoc | null>(null);
  useEffect(() => {
    getCategoryById(categoryId).then(setCategory).catch(() => setCategory(null));
  }, [categoryId]);

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
        <div className="info-value">{formatNumber(staticDownloads)}</div>

        <div className="info-label">Views:</div>
        <div className="info-value">{formatNumber(staticViews)}</div>

        <div className="info-label">ID:</div>
        <div className="info-value">{wallpaperId}</div>
      </div>
    </div>
  );
}