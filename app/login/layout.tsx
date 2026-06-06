import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Tavryne Wallpapers",
  description:
    "Sign in to your Tavryne Wallpapers account to access favorites, downloads, and personalized wallpaper collections.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: "https://tavrynewallpapers.vercel.app/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
