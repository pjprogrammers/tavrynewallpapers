"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import WallpaperGrid from '../../components/WallpaperGrid';
import CategoryList from '../../components/CategoryList';
import SearchBar from '../../components/SearchBar';

import {
  categories,
  tags,
} from '../../lib/wallpapers';

import {
  ArrowLeft,
  ArrowRight,
  Filter,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  X
} from 'lucide-react';

import type { Wallpaper } from '../../lib/wallpapers';

interface CategoryInfo {
  id: string;
  name: string;
  description?: string;
  count?: number;
}

interface Props {
  categoryId: string;
  category: CategoryInfo;
  initialWallpapers: Wallpaper[];
}

export default function CategoryPageContent({ categoryId, category, initialWallpapers }: Props) {
  const [viewMode, setViewMode] = useState<1 | 2 | 3>(2);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedResolutions, setSelectedResolutions] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const resolutions = ['1920x1080', '2560x1440', '3840x2160', '4K', '8K'];

  const wallpapers = initialWallpapers;

  const isFeaturedCategory = categoryId === 'all';

  const relevantTags = useMemo(() => {
    return tags
      .filter((tag) => wallpapers.some((w) => w.tags?.includes(tag.id)))
      .slice(0, 12);
  }, [wallpapers]);

  const filteredWallpapers = useMemo(() => {
    let result = [...wallpapers];

    if (selectedResolutions.length > 0) {
      result = result.filter(w =>
        selectedResolutions.some(res => w.resolution?.includes(res.replace('K', '000')))
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter(w =>
        w.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    return result;
  }, [wallpapers, selectedResolutions, selectedTags]);

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

  const featuredImage = wallpapers[0]?.filename || null;

  if (!category) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20" role="main" id="main-content">
        <section className="relative min-h-[300px] overflow-hidden bg-gradient-to-br from-background via-muted to-card" aria-labelledby="category-page-title">
          <div className="absolute inset-0 opacity-20">
            {featuredImage && (
              <div className="relative w-full h-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background opacity-80" />
                <Image
                  src={`/wallpapers/${featuredImage}`}
                  alt={category.name || 'Wallpaper Preview'}
                  fill
                  className="object-cover blur-md"
                  sizes="100vw"
                  priority
                />
              </div>
            )}
          </div>

          <div className="container mx-auto px-4 py-10 relative z-10">
            <nav className="py-4" aria-label="Breadcrumb">
              <Link
                href="/"
                className="flex items-center text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Home
              </Link>
            </nav>

            <header className="max-w-2xl">
              <h1 id="category-page-title" className="text-3xl font-bold mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-muted-foreground mb-4">
                  {category.description}
                </p>
              )}
              <div className="flex gap-4 items-center">
                {category.count !== undefined && (
                  <span className="text-sm py-1 px-3 bg-primary/10 text-primary rounded-full">
                    {category.count} wallpapers
                  </span>
                )}
                {isFeaturedCategory && (
                  <span className="text-sm py-1 px-3 bg-secondary/10 text-secondary rounded-full">
                    Featured Collection
                  </span>
                )}
              </div>
            </header>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <section className="mb-6" aria-label="Search">
            <SearchBar />
          </section>

          <section className="mb-8" aria-label="Categories">
            <CategoryList
              categories={categories}
              selectedCategory={category.id}
            />
          </section>

          {relevantTags.length > 0 && (
            <section className="mb-8" aria-label="Popular tags">
              <h2 className="font-medium mb-3">
                Popular Tags in {category.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {relevantTags.map((tag) => (
                  <Link key={tag.id} href={`/tag/${tag.id}`} className="tag-pill">
                    {tag.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-wrap justify-between items-center mb-4 gap-4" aria-label="Wallpaper count and controls">
            <div className="flex items-center gap-2">
              <h2 className="font-bold">{filteredWallpapers.length} Wallpapers</h2>
              {(selectedResolutions.length > 0 || selectedTags.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex gap-4">
              <button
                className={`action-button ${filterOpen ? 'active' : ''}`}
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
              <div className="flex border border-border rounded-md overflow-hidden">
                <button
                  className={`view-toggle-btn ${viewMode === 1 ? 'active' : ''}`}
                  onClick={() => setViewMode(1)}
                  title="Large grid"
                  aria-label="Large grid view"
                >
                  <Grid2X2 size={16} />
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === 2 ? 'active' : ''}`}
                  onClick={() => setViewMode(2)}
                  title="Medium grid"
                  aria-label="Medium grid view"
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === 3 ? 'active' : ''}`}
                  onClick={() => setViewMode(3)}
                  title="Small grid"
                  aria-label="Small grid view"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </section>

          {filterOpen && (
            <section className="filter-dropdown mb-6 p-4 bg-card border rounded-lg" aria-label="Filter options">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filter Wallpapers</h3>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Close filter"
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
            </section>
          )}

          <section aria-label="Wallpapers in this category">
            <WallpaperGrid
              wallpapers={filteredWallpapers}
              source="category"
              className={viewMode === 1 ? 'grid-cols-2' : viewMode === 3 ? 'grid-cols-4' : ''}
            />
          </section>

          {filteredWallpapers.length > 20 && (
            <nav className="mt-8 flex justify-center" aria-label="Pagination">
              <div className="pagination">
                <button className="pagination-btn active" aria-current="page">1</button>
                <button className="pagination-btn">2</button>
                <button className="pagination-btn">3</button>
                <span className="pagination-ellipsis">...</span>
                <button className="pagination-btn">8</button>
                <button className="pagination-btn next">
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}