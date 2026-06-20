"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Wallpaper } from "../lib/wallpapers";
import {
  getColumnCount,
  getColumnWidth,
  computeMasonryLayout,
  getWallpaperAspectRatio,
} from "@/lib/masonry-engine";
import MasonryCard from "./MasonryCard";

const DEFAULT_GAP = 16;
const SCROLL_SUPPRESS_MS = 200;

interface MasonryGridProps {
  wallpapers: Wallpaper[];
  className?: string;
  columnCount?: number;
  gap?: number;
  onLoadMore?: () => void;
}

export default function MasonryGrid({
  wallpapers,
  className = "",
  columnCount: columnCountOverride,
  gap = DEFAULT_GAP,
  onLoadMore,
}: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollState = useRef({ lastY: 0, lastTime: 0 });
  const scrollSuppressRef = useRef<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // ResizeObserver for container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(el);
    setContainerWidth(el.clientWidth);

    return () => observer.disconnect();
  }, []);

  // Adaptive scroll handler with velocity tracking + gesture suppression
  useEffect(() => {
    const handleScroll = () => {
      const now = performance.now();
      const sy = window.scrollY;
      const dt = now - scrollState.current.lastTime;
      const dy = Math.abs(sy - scrollState.current.lastY);

      if (dt > 0) {
        setScrollVelocity(dy / dt);
      }
      scrollState.current = { lastY: sy, lastTime: now };

      setScrollTop(sy);
      setViewportHeight(window.innerHeight);

      // Suppress accidental taps during/after scroll
      setIsScrolling(true);
      if (scrollSuppressRef.current) clearTimeout(scrollSuppressRef.current);
      scrollSuppressRef.current = window.setTimeout(
        () => setIsScrolling(false),
        SCROLL_SUPPRESS_MS
      );
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollSuppressRef.current) clearTimeout(scrollSuppressRef.current);
    };
  }, []);

  // IntersectionObserver for infinite scroll trigger
  useEffect(() => {
    if (!onLoadMore || !sentinelRef.current) return;

    const sentinel = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "600px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, wallpapers.length]);

  // Periodic drift correction: recalc layout every 200 items added
  const layoutGeneration = useRef(0);
  useEffect(() => {
    layoutGeneration.current += 1;
  }, [wallpapers.length]);

  // Adaptive buffer based on scroll velocity
  const adaptiveBuffer = useMemo(() => {
    if (scrollVelocity > 2.5) return 2800;
    if (scrollVelocity > 1.5) return 2000;
    if (scrollVelocity > 0.8) return 1200;
    if (scrollVelocity > 0.3) return 700;
    return 350;
  }, [scrollVelocity]);

  const columnCount = useMemo(
    () => columnCountOverride ?? getColumnCount(containerWidth),
    [containerWidth, columnCountOverride]
  );

  const columnWidth = useMemo(
    () => getColumnWidth(containerWidth, columnCount, gap),
    [containerWidth, columnCount, gap]
  );

  const items = useMemo(
    () =>
      wallpapers.map((w) => ({
        aspectRatio: getWallpaperAspectRatio(w),
      })),
    [wallpapers]
  );

  const layout = useMemo(
    () => computeMasonryLayout(items, columnCount, columnWidth, gap),
    [items, columnCount, columnWidth, gap]
  );

  // Visible range with adaptive buffer + viewport-aware priority
  const visibleRange = useMemo(() => {
    if (viewportHeight === 0) {
      return { start: 0, end: layout.positions.length };
    }

    const top = scrollTop - adaptiveBuffer;
    const bottom = scrollTop + viewportHeight + adaptiveBuffer;

    let start = 0;
    let end = layout.positions.length;

    for (let i = 0; i < layout.positions.length; i++) {
      const p = layout.positions[i];
      if (p.top + p.height >= top) {
        start = i;
        break;
      }
    }

    for (let i = layout.positions.length - 1; i >= 0; i--) {
      const p = layout.positions[i];
      if (p.top <= bottom) {
        end = i + 1;
        break;
      }
    }

    return { start, end };
  }, [layout.positions, scrollTop, viewportHeight, adaptiveBuffer]);

  const visibleWallpapers = useMemo(
    () => wallpapers.slice(visibleRange.start, visibleRange.end),
    [wallpapers, visibleRange.start, visibleRange.end]
  );

  const visiblePositions = useMemo(
    () => layout.positions.slice(visibleRange.start, visibleRange.end),
    [layout.positions, visibleRange.start, visibleRange.end]
  );

  if (wallpapers.length === 0) {
    return (
      <div className="wallpaper-grid-empty">
        <p>No wallpapers found</p>
      </div>
    );
  }

  if (containerWidth <= 0) {
    return (
      <div
        ref={containerRef}
        className={`masonry-grid ${className}`}
        style={{ minHeight: 200 }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`masonry-grid ${className} ${isScrolling ? "is-scrolling" : ""}`}
      style={{ height: layout.containerHeight, position: "relative", overflowAnchor: "auto" }}
    >
      {visibleWallpapers.map((wallpaper, i) => {
        const globalIndex = visibleRange.start + i;
        const pos = visiblePositions[i];
        const viewportCenter = scrollTop + viewportHeight / 2;
        const cardCenter = pos.top + pos.height / 2;
        const distFromCenter = Math.abs(cardCenter - viewportCenter);

        // Priority for near-viewport items (center + 1.5 viewports)
        const isPriority = distFromCenter < viewportHeight * 1.5;

        return (
          <MasonryCard
            key={wallpaper.id}
            wallpaper={wallpaper}
            position={pos}
            priority={isPriority}
          />
        );
      })}
      {onLoadMore && (
        <div
          ref={sentinelRef}
          className="masonry-sentinel"
          style={{ height: 1 }}
        />
      )}
    </div>
  );
}
