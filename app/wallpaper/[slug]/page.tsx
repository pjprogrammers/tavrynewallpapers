import { Metadata } from 'next';
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import WallpaperGrid from "../../components/WallpaperGrid";
import WallpaperActions from "./WallpaperActions";
import WallpaperImageLoading from "./WallpaperImageLoading";
import { 
  getWallpaperBySlug, 
  getCategoryById, 
  getWallpapersByCategory,
  getTagById,
  getTrendingWallpapers,
} from "../../lib/wallpapers";
import { Info, Tag, Eye, Clock, Download } from "lucide-react";

// Helper function to ensure consistent number formatting
const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

interface WallpaperPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: WallpaperPageProps): Promise<Metadata> {
  const wallpaper = getWallpaperBySlug(params.slug);
  
  if (!wallpaper) {
    return {
      title: "Wallpaper Not Found | Tavryne Wallpapers"
    };
  }
  
  return {
    title: `${wallpaper.title} | Tavryne Wallpapers`,
    description: wallpaper.description || `Download ${wallpaper.title} wallpaper in high quality resolution.`,
    openGraph: {
      images: [{
        url: `/wallpapers/${wallpaper.filename}`,
        width: 1200,
        height: 630,
        alt: wallpaper.title
      }]
    }
  };
}

export default function WallpaperPage({ params }: WallpaperPageProps) {
  const wallpaper = getWallpaperBySlug(params.slug);
  if (!wallpaper) return notFound();
  
  const category = getCategoryById(wallpaper.categoryId);
  
  // Get both related and trending wallpapers
  const relatedWallpapers = getWallpapersByCategory(wallpaper.categoryId)
    .filter(w => w.id !== wallpaper.id)
    .slice(0, 3);
  
  const trendingWallpapers = getTrendingWallpapers()
    .filter(w => w.id !== wallpaper.id && !relatedWallpapers.some(r => r.id === w.id))
    .slice(0, 3);
    
  // Combine both for "You might also like" section
  const recommendedWallpapers = [...relatedWallpapers, ...trendingWallpapers].slice(0, 4);
  
  // Generate download options
  const downloadOptions = [
    { name: "Original", resolution: wallpaper.resolution || "3840x2160", device: "Monitor", icon: "Monitor" },
    { name: "Desktop", resolution: "1920x1080", device: "Laptop", icon: "Laptop" },
    { name: "Mobile", resolution: "1080x1920", device: "Smartphone", icon: "Smartphone" },
  ];
  
  return (
    <div className="page-wrapper">
      <Header />
      
      {/* Wallpaper Hero Section */}
      <section className="wallpaper-hero">
        <div className="container">
          {/* Breadcrumb */}
          <div className="breadcrumbs">
            <Link href="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-separator">/</span>
            {category && (
              <>
                <Link href={`/categories/${category.id}`} className="breadcrumb-link">{category.name}</Link>
                <span className="breadcrumb-separator">/</span>
              </>
            )}
            <span className="breadcrumb-current">{wallpaper.title}</span>
          </div>
          
          <div className="wallpaper-content-grid">
            {/* Wallpaper Image */}
            <div className="wallpaper-main-container">
              <div className="wallpaper-image-container">
                <Suspense fallback={<WallpaperImageLoading />}>
                  <Image 
                    src={`/wallpapers/${wallpaper.filename}`}
                    alt={wallpaper.title}
                    fill
                    className="wallpaper-image loaded"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 60vw"
                  />
                </Suspense>
              </div>
              
              {/* Actions - Client Component */}
              <WallpaperActions
                wallpaper={wallpaper}
                downloadOptions={downloadOptions}
              />
              
              {/* Mobile Details (Visible on mobile only) */}
              <div className="wallpaper-mobile-details">
                <h1 className="wallpaper-title">{wallpaper.title}</h1>
                
                {wallpaper.description && (
                  <p className="wallpaper-description">{wallpaper.description}</p>
                )}
                
                {/* Quick stats for mobile */}
                <div className="wallpaper-stats-grid">
                  <div className="wallpaper-stat-card">
                    <Eye size={18} className="stat-icon" />
                    <span className="stat-label">Views</span>
                    <span className="stat-value">{formatNumber(wallpaper.views)}</span>
                  </div>
                  <div className="wallpaper-stat-card">
                    <Download size={18} className="stat-icon" />
                    <span className="stat-label">Downloads</span>
                    <span className="stat-value">{formatNumber(wallpaper.downloads)}</span>
                  </div>
                  <div className="wallpaper-stat-card">
                    <Clock size={18} className="stat-icon" />
                    <span className="stat-label">Uploaded</span>
                    <span className="stat-value">{new Date(wallpaper.uploadDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Wallpaper Details */}
            <div className="wallpaper-details-container">
              <h1 className="wallpaper-title">{wallpaper.title}</h1>
              
              {wallpaper.description && (
                <p className="wallpaper-description">{wallpaper.description}</p>
              )}
              
              {/* Stats */}
              <div className="wallpaper-stats-grid">
                <div className="wallpaper-stat-card animate-fade-in" style={{animationDelay: "0.1s"}}>
                  <Eye size={18} className="stat-icon" />
                  <span className="stat-label">Views</span>
                  <span className="stat-value">{formatNumber(wallpaper.views)}</span>
                </div>
                <div className="wallpaper-stat-card animate-fade-in" style={{animationDelay: "0.2s"}}>
                  <Download size={18} className="stat-icon" />
                  <span className="stat-label">Downloads</span>
                  <span className="stat-value">{formatNumber(wallpaper.downloads)}</span>
                </div>
                <div className="wallpaper-stat-card animate-fade-in" style={{animationDelay: "0.3s"}}>
                  <Clock size={18} className="stat-icon" />
                  <span className="stat-label">Uploaded</span>
                  <span className="stat-value">{new Date(wallpaper.uploadDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Details */}
              <div className="wallpaper-info-card animate-fade-in" style={{animationDelay: "0.4s"}}>
                <div className="info-card-header">
                  <Info size={18} className="info-icon" />
                  <h3 className="info-title">Details</h3>
                </div>
                <div className="info-grid">
                  <div className="info-label">Category:</div>
                  <div className="info-value">
                    <Link href={`/categories/${category?.id || ''}`} className="info-link">
                      {category?.name || 'Uncategorized'}
                    </Link>
                  </div>
                  
                  {wallpaper.resolution && (
                    <>
                      <div className="info-label">Resolution:</div>
                      <div className="info-value">{wallpaper.resolution}</div>
                    </>
                  )}
                  
                  <div className="info-label">Uploaded:</div>
                  <div className="info-value">{new Date(wallpaper.uploadDate).toLocaleDateString()}</div>
                  
                  <div className="info-label">Downloads:</div>
                  <div className="info-value">{formatNumber(wallpaper.downloads)}</div>
                  
                  <div className="info-label">Views:</div>
                  <div className="info-value">{formatNumber(wallpaper.views)}</div>
                  
                  <div className="info-label">ID:</div>
                  <div className="info-value">{wallpaper.id}</div>
                </div>
              </div>
              
              {/* Tags */}
              <div className="wallpaper-tags-container animate-fade-in" style={{animationDelay: "0.5s"}}>
                <div className="tags-header">
                  <Tag size={18} className="tags-icon" />
                  <h3 className="tags-title">Tags</h3>
                </div>
                <div className="tags-grid">
                  {wallpaper.tags.map((tagId, index) => {
                    const tag = getTagById(tagId);
                    return tag ? (
                      <Link
                        key={tag.id}
                        href={`/tag/${tag.id}`}
                        className="tag-pill animate-fade-in"
                        style={{animationDelay: `${0.1 * index + 0.6}s`}}
                      >
                        {tag.name}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Tags (Visible on mobile only) */}
          <div className="wallpaper-mobile-tags">
            <div className="tags-header">
              <Tag size={18} className="tags-icon" />
              <h3 className="tags-title">Tags</h3>
            </div>
            <div className="tags-grid">
              {wallpaper.tags.map(tagId => {
                const tag = getTagById(tagId);
                return tag ? (
                  <Link
                    key={tag.id}
                    href={`/tag/${tag.id}`}
                    className="tag-pill"
                  >
                    {tag.name}
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </section>
      
      {/* Related Wallpapers */}
      {recommendedWallpapers.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div className="section-title-wrapper">
                <h2 className="section-title">You might also like</h2>
                <p className="section-description">Similar wallpapers based on your selection</p>
              </div>
            </div>
            <WallpaperGrid wallpapers={recommendedWallpapers} />
          </div>
        </section>
      )}
      
      <Footer />
    </div>
  );
} 