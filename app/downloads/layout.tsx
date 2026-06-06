import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Downloads | Tavryne Wallpapers",
  description: "View your wallpaper download history on Tavryne Wallpapers.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: "https://tavrynewallpapers.vercel.app/downloads",
  },
};

export default function DownloadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
