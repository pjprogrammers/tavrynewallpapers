import { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AdminContent from "./AdminContent";
import { hasPermission } from "@/lib/roles";
import { Layers } from "lucide-react";

const SITE_URL = "https://tavrynewallpapers.vercel.app";

// Admin dashboard reads live data from Firestore. Don't pre-render at
// build time — build workers can't reach Firestore, and the page would
// otherwise be served with empty data.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard | Tavryne Wallpapers",
  description: "Internal admin dashboard for managing roles, wallpapers, and edits.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: `${SITE_URL}/admin`,
  },
};

export default function AdminPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20" role="main" id="main-content">
        <AdminContent />
      </main>
      <Footer />
    </div>
  );
}
