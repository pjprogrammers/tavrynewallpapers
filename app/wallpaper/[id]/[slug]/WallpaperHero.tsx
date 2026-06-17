"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { Tag } from "lucide-react";
import WallpaperActions from "./WallpaperActions";
import WallpaperImageLoading from "./WallpaperImageLoading";
import WallpaperStats from "./WallpaperStats";
import WallpaperInfoCard from "./WallpaperInfoCard";
import EditWallpaperButton from "../../../components/EditWallpaperButton";
import { useWallpaperContext } from "./WallpaperEditProvider";
import { getCategoryById } from "../../../lib/wallpapers";
import { resolveImageUrl } from "@/lib/wallpaper-image";
import { listTags } from "@/lib/tag-store";

export function WallpaperHero({
  category,
  downloadOptions,
}: {
  category: ReturnType<typeof getCategoryById> | null;
  downloadOptions: Array<{ name: string; resolution: string; device: string; icon: string }>;
}) {
  const { wallpaper: merged } = useWallpaperContext();
  const [tagNameMap, setTagNameMap] = useState<Record<string, string>>({});
  useEffect(() => {
    listTags()
      .then((tags) => {
        const map: Record<string, string> = {};
        tags.forEach((t) => { map[t.id] = t.name; });
        setTagNameMap(map);
      })
      .catch(() => {});
  }, []);
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
              wallpaper={{ ...merged }}
              downloadOptions={downloadOptions}
            />

            {/* Mobile Details */}
            <div className="wallpaper-mobile-details">
              <div className="wallpaper-title-row">
                <h2 className="wallpaper-title" aria-hidden="true">
                  {merged.title}
                </h2>
                <EditWallpaperButton
                  slug={merged.slug}
                  wallpaper={{ ...merged }}
                />
              </div>

              {merged.description && (
                <p className="wallpaper-description">{merged.description}</p>
              )}

              <WallpaperStats
                wallpaper={{ ...merged }}
              />
            </div>
          </div>

          {/* Wallpaper Details */}
          <aside
            className="wallpaper-details-container"
            aria-label="Wallpaper details"
          >
            <div className="wallpaper-title-row">
              <h1 className="wallpaper-title" itemProp="name">
                {merged.title}
              </h1>
              <EditWallpaperButton
                slug={merged.slug}
                wallpaper={{ ...merged }}
              />
            </div>

            {merged.description && (
              <p className="wallpaper-description" itemProp="description">
                {merged.description}
              </p>
            )}

            <WallpaperStats
              wallpaper={{ ...merged }}
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
                  const tagName = tagNameMap[tagId];
                  return tagName ? (
                    <Link
                      key={`${tagId}-${index}`}
                      href={`/tag/${tagId}`}
                      className="tag-pill animate-fade-in"
                      style={{ animationDelay: `${0.1 * index + 0.6}s` }}
                    >
                      {tagName}
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
  const [tagNameMap, setTagNameMap] = useState<Record<string, string>>({});
  useEffect(() => {
    listTags()
      .then((tags) => {
        const map: Record<string, string> = {};
        tags.forEach((t) => { map[t.id] = t.name; });
        setTagNameMap(map);
      })
      .catch(() => {});
  }, []);
  return (
    <section className="wallpaper-mobile-tags" aria-label="Wallpaper tags">
      <div className="tags-header">
        <Tag size={18} className="tags-icon" />
        <h3 className="tags-title">Tags</h3>
      </div>
      <div className="tags-grid">
        {merged.tags.map((tagId, index) => {
          const tagName = tagNameMap[tagId];
          return tagName ? (
            <Link
              key={`mobile-${tagId}-${index}`}
              href={`/tag/${tagId}`}
              className="tag-pill"
            >
              {tagName}
            </Link>
          ) : null;
        })}
      </div>
    </section>
  );
}
