import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Favorites | Tavryne Wallpapers",
  description: "View and manage your favorite wallpapers on Tavryne Wallpapers.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: "https://tavrynewallpapers.vercel.app/favorites",
  },
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
