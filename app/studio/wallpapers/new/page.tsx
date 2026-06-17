import { Metadata } from "next";
import CreateWallpaperForm from "./CreateWallpaperForm";

const SITE_URL = "https://tavrynewallpapers.vercel.app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Wallpaper | Studio | Tavryne Wallpapers",
  description: "Create a new wallpaper",
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/studio/wallpapers/new` },
};

export default function NewWallpaperPage() {
  return <CreateWallpaperForm />;
}
