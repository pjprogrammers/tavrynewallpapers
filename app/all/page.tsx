"use client";

import { useState, useMemo } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WallpaperGrid from "../components/WallpaperGrid";
import { getAllWallpapers, tags, Wallpaper } from "../lib/wallpapers";
import { ChevronDown, Filter, X, ArrowUpDown, Star, TrendingUp, Download, ArrowDownAZ, Eye } from "lucide-react";
import Link from "next/link";

type SortOption = "newest" | "popular" | "downloads" | "views" | "alphabetical";

export default function AllWallpapersPage() {
  const allWallpapers = getAllWallpapers();

  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedResolutions, setSelectedResolutions] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const resolutions = ['1920x1080', '2560x1440', '3840x2160', '4K', '8K'];

  const sortedAndFilteredWallpapers = useMemo(() => {
    let result = [...allWallpapers];

    // Apply resolution filter
    if (selectedResolutions.length > 0) {
      result = result.filter(w =>
        selectedResolutions.some(res => w.resolution?.includes(res.replace('K', '000')))
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      result = result.filter(w =>
        w.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.uploadDate || '1970-01-01').getTime() - new Date(a.uploadDate || '1970-01-01').getTime());
        break;
      case "popular":
        // Most liked
        result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case "downloads":
        // Most downloaded on top
        result.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        break;
      case "views":
        // Most viewed on top
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "alphabetical":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [allWallpapers, sortBy, selectedResolutions, selectedTags]);

  const toggleResolution = (res: string) => {
    setSelectedResolutions(prev =>
      prev.includes(res) ? prev.filter(r => r !== res) : [...prev, res]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedResolutions([]);
    setSelectedTags([]);
  };

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: "newest", label: "Newest First", icon: <Star size={14} /> },
    { value: "downloads", label: "Most Downloads", icon: <Download size={14} /> },
    { value: "views", label: "Most Viewed", icon: <Eye size={14} /> },
    { value: "popular", label: "Most Popular", icon: <TrendingUp size={14} /> },
    { value: "alphabetical", label: "A-Z", icon: <ArrowDownAZ size={14} /> },
  ];

  return (
    <div className="page-wrapper">
      <Header />

      <section className="section section-hero">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">All Wallpapers</h1>
            <p className="page-description">
              Browse our complete collection of {allWallpapers.length} high-quality wallpapers
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="filter-controls">
            <div className="filter-info">
              <span className="filter-count">
                {sortedAndFilteredWallpapers.length} wallpapers
                {(selectedResolutions.length > 0 || selectedTags.length > 0) && (
                  <span className="text-muted-foreground ml-2">
                    (filtered from {allWallpapers.length})
                  </span>
                )}
              </span>
            </div>
            <div className="filter-actions">
              <button
                className={`filter-button ${filterOpen ? 'active' : ''}`}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <Filter size={16} />
                <span>Filter</span>
                {(selectedResolutions.length > 0 || selectedTags.length > 0) && (
                  <span className="ml-1 bg-primary text-black text-xs px-1.5 rounded-full">
                    {selectedResolutions.length + selectedTags.length}
                  </span>
                )}
              </button>
              <div className="filter-sort relative">
                <button
                  className="filter-button"
                  onClick={() => setSortOpen(!sortOpen)}
                >
                  <ArrowUpDown size={16} />
                  <span>Sort by</span>
                  <ChevronDown size={16} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                </button>

                {sortOpen && (
                  <div className="sort-dropdown">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
                        onClick={() => {
                          setSortBy(option.value);
                          setSortOpen(false);
                        }}
                      >
                        {option.icon}
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Dropdown */}
          {filterOpen && (
            <div className="filter-dropdown mb-6 p-4 bg-card border rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filter Wallpapers</h3>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Resolution</h4>
                  <div className="flex flex-wrap gap-2">
                    {resolutions.map(res => (
                      <button
                        key={res}
                        onClick={() => toggleResolution(res)}
                        className={`filter-chip ${selectedResolutions.includes(res) ? 'active' : ''}`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 10).map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`filter-chip ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {(selectedResolutions.length > 0 || selectedTags.length > 0) && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          <WallpaperGrid wallpapers={sortedAndFilteredWallpapers} source="category" />

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