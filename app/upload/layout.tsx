import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Wallpaper | Tavryne Wallpapers",
  description: "Upload and share your high-quality wallpapers with the Tavryne community.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: "https://tavrynewallpapers.vercel.app/upload",
  },
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
