import Header from "../components/Header";
import Footer from "../components/Footer";
import WallpaperGrid from "../components/WallpaperGrid";
import { getAllWallpapers } from "../lib/wallpapers";
import { ChevronDown, Filter } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "All Wallpapers | Tavryne Wallpapers",
  description: "Browse our complete collection of high-quality wallpapers for desktop and mobile devices"
};

export default function AllWallpapersPage() {
  const wallpapers = getAllWallpapers();
  
  return (
    <div className="page-wrapper">
      <Header />
      
      <section className="section section-hero">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">All Wallpapers</h1>
            <p className="page-description">
              Browse our complete collection of {wallpapers.length} high-quality wallpapers
            </p>
          </div>
        </div>
      </section>
      
      <section className="section">
        <div className="container">
          <div className="filter-controls">
            <div className="filter-info">
              <span className="filter-count">{wallpapers.length} wallpapers</span>
            </div>
            <div className="filter-actions">
              <div className="filter-sort">
                <button className="filter-button">
                  <Filter size={16} />
                  <span>Sort by</span>
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          </div>
          
          <WallpaperGrid wallpapers={wallpapers} />
          
          <div className="browse-more">
            <h3 className="browse-more-title">Looking for something specific?</h3>
            <div className="browse-more-actions">
              <Link href="/categories/all" className="browse-more-button">
                Browse Categories
              </Link>
              <Link href="/featured" className="browse-more-button outline">
                Featured Wallpapers
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
} 