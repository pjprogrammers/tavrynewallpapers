import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Profile | Tavryne Wallpapers",
  description: "Manage your Tavryne Wallpapers profile, favorites, downloads, and account settings.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: "https://tavrynewallpapers.vercel.app/profile",
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
