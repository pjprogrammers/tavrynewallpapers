import { Metadata } from "next";
import { notFound } from "next/navigation";
import EditWallpaperPage from "./EditWallpaperPage";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit #${id} | Studio | Tavryne Wallpapers`,
    robots: { index: false, follow: false },
  };
}

export default async function EditPage({ params }: Props) {
  const { id } = await params;
  const { getWallpaperByIdServer } = await import("@/lib/wallpaper-store-server");
  const wallpaper = await getWallpaperByIdServer(id, { includeUnpublished: true });
  if (!wallpaper) { notFound(); }

  return <EditWallpaperPage wallpaper={wallpaper} />;
}
