"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Tag } from "lucide-react";
import WallpaperActions from "./WallpaperActions";
import WallpaperImageLoading from "./WallpaperImageLoading";
import WallpaperStats from "./WallpaperStats";
import WallpaperInfoCard from "./WallpaperInfoCard";
import { useWallpaperContext } from "./WallpaperEditProvider";
import { getCategoryById, getTagById } from "../../lib/wallpapers";
import { resolveImageUrl } from "@/lib/wallpaper-image";

export function WallpaperHero({
  category,
  downloadOptions,
}: {
  category: ReturnType<typeof getCategoryById> | null;
  downloadOptions: Array<{ name: string; resolution: string; device: string; icon: string }>;
}) {
  const { wallpaper: merged } = useWallpaperContext();
  return (
    <article
      className="wallpaper-hero"
      itemScope
      itemType="https://schema.org/ImageObject"
    >
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/" className="breadcrumb-link">
            Home
          </Link>
          <span className="breadcrumb-separator">/</span>
          {category && (
            <>
              <Link
                href={`/categories/${category.id}`}
                className="breadcrumb-link"
              >
                {category.name}
              </Link>
              <span className="breadcrumb-separator">/</span>
            </>
          )}
          <span className="breadcrumb-current" aria-current="page">
            {merged.title}
          </span>
        </nav>

        <div className="wallpaper-content-grid">
          {/* Wallpaper Image */}
          <div className="wallpaper-main-container">
            <figure className="wallpaper-image-container">
              <Suspense fallback={<WallpaperImageLoading />}>
                <Image
                  src={resolveImageUrl(merged) ?? `/wallpapers/${merged.filename}`}
                  alt={merged.title}
                  fill
                  className="wallpaper-image loaded"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 60vw"
                  itemProp="contentUrl"
                />
              </Suspense>
            </figure>

            {/* Actions - Client Component */}
            <WallpaperActions
              wallpaper={{
                id: merged.id,
                title: merged.title,
                filename: merged.filename,
                slug: merged.slug,
                categoryId: merged.categoryId,
                tags: merged.tags,
                views: 0,
                downloads: 0,
                likes: 0,
                uploadDate: merged.uploadDate,
                resolution: merged.resolution,
                description: merged.description,
                featured: merged.featured,
                trending: merged.trending,
              }}
              downloadOptions={downloadOptions}
            />

            {/* Mobile Details */}
            <div className="wallpaper-mobile-details">
              <h2 className="wallpaper-title" aria-hidden="true">
                {merged.title}
              </h2>

              {merged.description && (
                <p className="wallpaper-description">{merged.description}</p>
              )}

              <WallpaperStats
                wallpaper={{
                  id: merged.id,
                  title: merged.title,
                  filename: merged.filename,
                  slug: merged.slug,
                  categoryId: merged.categoryId,
                  tags: merged.tags,
                  views: 0,
                  downloads: 0,
                  likes: 0,
                  uploadDate: merged.uploadDate,
                  resolution: merged.resolution,
                }}
              />
            </div>
          </div>

          {/* Wallpaper Details */}
          <aside
            className="wallpaper-details-container"
            aria-label="Wallpaper details"
          >
            <h1 className="wallpaper-title" itemProp="name">
              {merged.title}
            </h1>

            {merged.description && (
              <p className="wallpaper-description" itemProp="description">
                {merged.description}
              </p>
            )}

            <WallpaperStats
              wallpaper={{
                id: merged.id,
                title: merged.title,
                filename: merged.filename,
                slug: merged.slug,
                categoryId: merged.categoryId,
                tags: merged.tags,
                views: 0,
                downloads: 0,
                likes: 0,
                uploadDate: merged.uploadDate,
                resolution: merged.resolution,
              }}
            />

            <WallpaperInfoCard
              wallpaperId={merged.id}
              categoryId={merged.categoryId}
              resolution={merged.resolution}
              uploadDate={merged.uploadDate}
              staticViews={0}
              staticDownloads={0}
            />

            {/* Tags (desktop) */}
            <section
              className="wallpaper-tags-container animate-fade-in"
              style={{ animationDelay: "0.5s" }}
              aria-label="Wallpaper tags"
            >
              <div className="tags-header">
                <Tag size={18} className="tags-icon" />
                <h3 className="tags-title">Tags</h3>
              </div>
              <div className="tags-grid">
                {merged.tags.map((tagId, index) => {
                  const tag = getTagById(tagId);
                  return tag ? (
                    <Link
                      key={`${tagId}-${index}`}
                      href={`/tag/${tagId}`}
                      className="tag-pill animate-fade-in"
                      style={{ animationDelay: `${0.1 * index + 0.6}s` }}
                    >
                      {tag.name}
                    </Link>
                  ) : null;
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </article>
  );
}

export function WallpaperMobileTags() {
  const { wallpaper: merged } = useWallpaperContext();
  return (
    <section className="wallpaper-mobile-tags" aria-label="Wallpaper tags">
      <div className="tags-header">
        <Tag size={18} className="tags-icon" />
        <h3 className="tags-title">Tags</h3>
      </div>
      <div className="tags-grid">
        {merged.tags.map((tagId, index) => {
          const tag = getTagById(tagId);
          return tag ? (
            <Link
              key={`mobile-${tagId}-${index}`}
              href={`/tag/${tagId}`}
              className="tag-pill"
            >
              {tag.name}
            </Link>
          ) : null;
        })}
      </div>
    </section>
  );
}
