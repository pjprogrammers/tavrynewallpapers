import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import WallpaperGrid from '../../components/WallpaperGrid';
import CategoryList from '../../components/CategoryList';
import SearchBar from '../../components/SearchBar';

import {
  categories,
  getWallpapersByCategory,
  getCategoryById,
  tags
} from '../../lib/wallpapers';

import {
  ArrowLeft,
  Filter,
  SlidersHorizontal,
  Grid2X2,
  Grid3X3,
  LayoutGrid
} from 'lucide-react';

// ✅ Use type with params prop (not an interface)
type CategoryPageProps = {
  params: {
    categoryId: string;
  };
};

// ✅ Server Component
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoryId } = params;

  let category;
  let wallpapers;

  if (categoryId === 'all') {
    category = {
      id: 'all',
      name: 'All Categories',
      description:
        'Explore our complete collection of high-quality wallpapers across all categories.',
      count: undefined
    };

    wallpapers = categories
      .flatMap((cat) => getWallpapersByCategory(cat.id).slice(0, 5))
      .slice(0, 32);
  } else {
    category = getCategoryById(categoryId);
    if (!category) return notFound();
    wallpapers = getWallpapersByCategory(categoryId);
  }

  const isFeaturedCategory = categoryId === 'all';

  const relevantTags = tags
    .filter((tag) => wallpapers.some((w) => w.tags.includes(tag.id)))
    .slice(0, 12);

  const featuredImage = wallpapers[0]?.filename || null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted to-card">
          <div className="absolute inset-0 opacity-20">
            {featuredImage && (
              <div className="relative w-full h-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background opacity-80"></div>
                <Image
                  src={`/wallpapers/${featuredImage}`}
                  alt={category.name}
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
            <CategoryList categories={categories} selectedCategory={category.id} />
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
              <SlidersHorizontal size={18} className="text-primary" />
              <h2 className="font-bold">{wallpapers.length} Wallpapers</h2>
            </div>

            <div className="flex gap-4">
              <button className="action-button">
                <Filter size={16} />
                <span>Filter</span>
              </button>
              <div className="flex border border-border rounded-md overflow-hidden">
                <button className="view-toggle-btn active">
                  <Grid2X2 size={16} />
                </button>
                <button className="view-toggle-btn">
                  <Grid3X3 size={16} />
                </button>
                <button className="view-toggle-btn">
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </div>

          <WallpaperGrid wallpapers={wallpapers} />

          {wallpapers.length > 20 && (
            <div className="mt-8 flex justify-center">
              <div className="pagination">
                <button className="pagination-btn active">1</button>
                <button className="pagination-btn">2</button>
                <button className="pagination-btn">3</button>
                <span className="pagination-ellipsis">...</span>
                <button className="pagination-btn">8</button>
                <button className="pagination-btn next">
                  Next <ArrowLeft size={14} className="rotate-180" />
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
