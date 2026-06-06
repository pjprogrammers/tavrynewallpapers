import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | Tavryne Wallpapers",
  description:
    "Sign up for a free Tavryne Wallpapers account to save favorites, track downloads, and upload your own wallpapers.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: "https://tavrynewallpapers.vercel.app/signup",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
