import Header from "./components/Header";
import Footer from "./components/Footer";
import WallpaperGrid from "./components/WallpaperGrid";
import SearchBar from "./components/SearchBar";
import CategoryList from "./components/CategoryList";
import { categories, getAllWallpapers, getTrendingWallpapers, getFeaturedWallpapers } from "./lib/wallpapers";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Download, Heart, TrendingUp } from "lucide-react";

export default function Home() {
  const allWallpapers = getAllWallpapers().slice(0, 8);
  const trendingWallpapers = getTrendingWallpapers().slice(0, 4);
  const featuredWallpapers = getFeaturedWallpapers().slice(0, 6);
  
  return (
    <div className="page-wrapper">
      <Header />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
          <div className="hero-gradient"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Find Your Perfect <span className="hero-highlight animate-pulse-subtle">Wallpaper</span>
            </h1>
            <p className="hero-subtitle">
              Discover and download stunning high-resolution wallpapers for desktop and mobile
            </p>
            <div className="hero-search animate-fade-in">
              <SearchBar />
            </div>
            
            <div className="hero-categories animate-fade-in">
              <h3 className="hero-categories-title">Trending Categories</h3>
              <div className="hero-category-pills">
                {categories.slice(0, 7).map((category, index) => (
                  <Link 
                    href={`/categories/${category.id}`} 
                    key={category.id}
                    className="hero-category-pill"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {category.name}
                  </Link>
                ))}
                <Link href="/categories/all" className="hero-category-pill view-all animate-pulse-subtle">
                  View All
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Wallpapers Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-title-wrapper">
              <h2 className="section-title">Featured Wallpapers</h2>
              <p className="section-description">Our curated selection of stunning high-quality wallpapers</p>
            </div>
            <Link href="/featured" className="section-link">
              View all featured
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="featured-grid">
            {featuredWallpapers.map((wallpaper, index) => (
              <Link 
                key={wallpaper.id}
                href={`/wallpaper/${wallpaper.slug}`}
                className={`featured-item featured-item-${index} animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="featured-image-container">
                  <Image
                    src={`/wallpapers/${wallpaper.filename}`}
                    alt={wallpaper.title}
                    fill
                    className="featured-image"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index < 2}
                  />
                  <div className="featured-overlay">
                    <div className="featured-content">
                      <h3 className="featured-title">{wallpaper.title}</h3>
                      <div className="featured-meta">
                        <span className="featured-resolution">{wallpaper.resolution}</span>
                        <div className="featured-stats">
                          <span className="featured-stat">
                            <Download size={14} />
                            {wallpaper.downloads.toLocaleString()}
                          </span>
                          <span className="featured-stat">
                            <Heart size={14} />
                            {Math.floor(wallpaper.downloads * 0.7).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <div className="section-title-wrapper">
              <h2 className="section-title">Browse Categories</h2>
              <p className="section-description">Explore wallpapers by your favorite categories</p>
            </div>
            <Link href="/categories/all" className="section-link">
              View all categories
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="categories-grid">
            {categories.slice(0, 8).map((category, index) => (
              <Link 
                key={category.id}
                href={`/categories/${category.id}`}
                className="category-card animate-fade-in animate-glow"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="category-content">
                  <h3 className="category-title">{category.name}</h3>
                  {category.count && (
                    <span className="category-count">{category.count} wallpapers</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* All Wallpapers Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-title-wrapper">
              <h2 className="section-title">All Wallpapers</h2>
              <p className="section-description">Browse our complete collection of wallpapers</p>
            </div>
            <Link href="/all" className="section-link">
              View all wallpapers
              <ChevronRight size={16} />
            </Link>
          </div>
          <WallpaperGrid wallpapers={allWallpapers} />
        </div>
      </section>
      
      {/* Trending Section */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <div className="section-title-wrapper">
              <div className="section-badge">
                <TrendingUp size={14} />
                Popular Now
              </div>
              <h2 className="section-title">Trending Wallpapers</h2>
              <p className="section-description">Most downloaded wallpapers this week</p>
            </div>
            <Link href="/trending" className="section-link">
              View all trending
              <ChevronRight size={16} />
            </Link>
          </div>
          <WallpaperGrid wallpapers={trendingWallpapers} />
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content animate-fade-in">
            <h2 className="cta-title">Ready to customize your screens?</h2>
            <p className="cta-description">
              Explore our collection of high-quality wallpapers and find the perfect one for your device.
            </p>
            <div className="cta-actions">
              <Link href="/categories/all" className="cta-button primary animate-pulse-subtle">
                Browse Categories
              </Link>
              <Link href="/all" className="cta-button secondary">
                All Wallpapers
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
