"use client";

import { useState, useMemo, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import WallpaperGrid from '../../components/WallpaperGrid';
import CategoryList from '../../components/CategoryList';
import SearchBar from '../../components/SearchBar';

import {
  categories,
  getWallpapersByCategory,
  getCategoryById,
  tags,
  Wallpaper
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

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params?.categoryId as string;

  const [viewMode, setViewMode] = useState<1 | 2 | 3>(2);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedResolutions, setSelectedResolutions] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const resolutions = ['1920x1080', '2560x1440', '3840x2160', '4K', '8K'];

  // Get category and wallpapers from server data
  const category = useMemo(() => {
    if (categoryId === 'all') {
      return {
        id: 'all',
        name: 'All Categories',
        description: 'Explore our complete collection of high-quality wallpapers across all categories.',
        count: undefined
      };
    }
    return getCategoryById(categoryId);
  }, [categoryId]);

  const wallpapers = useMemo(() => {
    if (!category) return [];
    if (categoryId === 'all') {
      return categories
        .flatMap((cat) => getWallpapersByCategory(cat.id).slice(0, 5))
        .slice(0, 32);
    }
    return getWallpapersByCategory(categoryId);
  }, [category, categoryId]);

  const isFeaturedCategory = categoryId === 'all';

  const relevantTags = useMemo(() => {
    return tags
      .filter((tag) => wallpapers.some((w) => w.tags.includes(tag.id)))
      .slice(0, 12);
  }, [wallpapers]);

  // Handle not found
  useEffect(() => {
    if (categoryId && categoryId !== 'all' && !category) {
      notFound();
    }
  }, [categoryId, category]);

  if (!category || !categoryId) {
    return null; // Loading state
  }

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted to-card">
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
            <div className="py-4">
              <Link
                href="/"
                className="flex items-center text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Home
              </Link>
            </div>

            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
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
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <SearchBar />
          </div>

          <div className="mb-8">
            <CategoryList
              categories={categories}
              selectedCategory={category.id}
            />
          </div>

          {relevantTags.length > 0 && (
            <div className="mb-8">
              <h3 className="font-medium mb-3">
                Popular Tags in {category.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {relevantTags.map((tag) => (
                  <Link key={tag.id} href={`/tag/${tag.id}`} className="tag-pill">
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
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
                >
                  <Grid2X2 size={16} />
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === 2 ? 'active' : ''}`}
                  onClick={() => setViewMode(2)}
                  title="Medium grid"
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === 3 ? 'active' : ''}`}
                  onClick={() => setViewMode(3)}
                  title="Small grid"
                >
                  <LayoutGrid size={16} />
                </button>
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
            </div>
          )}

          <WallpaperGrid
            wallpapers={filteredWallpapers}
            source="category"
            className={viewMode === 1 ? 'grid-cols-2' : viewMode === 3 ? 'grid-cols-4' : ''}
          />

          {filteredWallpapers.length > 20 && (
            <div className="mt-8 flex justify-center">
              <div className="pagination">
                <button className="pagination-btn active">1</button>
                <button className="pagination-btn">2</button>
                <button className="pagination-btn">3</button>
                <span className="pagination-ellipsis">...</span>
                <button className="pagination-btn">8</button>
                <button className="pagination-btn next">
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}