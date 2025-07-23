import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WallpaperGrid from "../components/WallpaperGrid";
import SearchBar from "../components/SearchBar";
import CategoryList from "../components/CategoryList";
import { categories, getFeaturedWallpapers } from "../lib/wallpapers";
import { ArrowLeft } from "lucide-react";

export default function FeaturedPage() {
  const featuredWallpapers = getFeaturedWallpapers();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="py-4">
            <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft size={16} className="mr-1" /> Back to Home
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold mb-6">Featured Wallpapers</h1>
          
          {/* Search bar */}
          <div className="mb-6">
            <SearchBar />
          </div>
          
          {/* Categories */}
          <div className="mb-8">
            <CategoryList categories={categories} />
          </div>
          
          {/* Wallpapers */}
          <WallpaperGrid wallpapers={featuredWallpapers} />
        </div>
      </main>
      <Footer />
    </div>
  );
} 