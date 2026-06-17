import { permanentRedirect } from "next/navigation";
import { getWallpaperById as getStaticWallpaperById, getWallpaperBySlug as getStaticWallpaperBySlug } from "../../lib/wallpapers";
import { getWallpaperByIdServer, getWallpaperBySlugServer } from "@/lib/wallpaper-store-server";
import { createSlug } from "@/lib/slug";

interface WallpaperIdRedirectProps {
  params: Promise<{ id: string }>;
}

export default async function WallpaperIdRedirect({ params }: WallpaperIdRedirectProps) {
  const { id } = await params;

  const firestoreById = await getWallpaperByIdServer(id);
  const staticById = getStaticWallpaperById(id);
  const byId = firestoreById ?? staticById;

  if (byId) {
    const correctSlug = createSlug(byId.title);
    permanentRedirect(`/wallpaper/${byId.id}/${correctSlug}`);
  }

  const firestoreBySlug = await getWallpaperBySlugServer(id);
  const staticBySlug = getStaticWallpaperBySlug(id);
  const bySlug = firestoreBySlug ?? staticBySlug;

  if (bySlug) {
    const correctSlug = createSlug(bySlug.title);
    permanentRedirect(`/wallpaper/${bySlug.id}/${correctSlug}`);
  }

  const { notFound } = await import("next/navigation");
  notFound();
}
