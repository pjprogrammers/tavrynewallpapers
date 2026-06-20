"use client";

import { Wallpaper } from "../lib/wallpapers";
import MasonryGrid from "./MasonryGrid";

interface FeaturedGridWithStatsProps {
  wallpapers: Wallpaper[];
}

export default function FeaturedGridWithStats({
  wallpapers,
}: FeaturedGridWithStatsProps) {
  return <MasonryGrid wallpapers={wallpapers} />;
}
