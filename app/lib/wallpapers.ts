export interface WallpaperCategory {
  id: string;
  name: string;
  count?: number;
  description?: string;
}

export interface WallpaperTag {
  id: string;
  name: string;
}

export interface Wallpaper {
  id: string;
  title: string;
  description?: string;
  filename: string;
  slug: string;
  categoryId: string;
  tags: string[];
  views: number;
  downloads: number;
  featured?: boolean;
  trending?: boolean;
  uploadDate: string;
  resolution?: string;
}

// Define categories
export const categories: WallpaperCategory[] = [
  { id: "abstract", name: "Abstract", description: "Abstract artistic wallpapers" },
  { id: "nature", name: "Nature", description: "Beautiful landscapes and nature scenes" },
  { id: "animals", name: "Animals", description: "Wallpapers featuring animals and wildlife" },
  { id: "space", name: "Space", description: "Cosmic and space-themed wallpapers" },
  { id: "dark", name: "Dark", description: "Dark-themed minimalist wallpapers" },
  { id: "minimal", name: "Minimal", description: "Clean minimalist design wallpapers" },
  { id: "technology", name: "Technology", description: "Tech-related wallpapers" },
  { id: "cars", name: "Cars", description: "Luxury and sports cars" },
  { id: "anime", name: "Anime", description: "Anime and animation wallpapers" },
  { id: "architecture", name: "Architecture", description: "Building designs and architecture" }
];

// Define tags
export const tags: WallpaperTag[] = [
  { id: "4k", name: "4K" },
  { id: "5k", name: "5K" },
  { id: "8k", name: "8K" },
  { id: "hd", name: "HD" },
  { id: "dark", name: "Dark Mode" },
  { id: "gradient", name: "Gradient" },
  { id: "black", name: "Black" },
  { id: "blue", name: "Blue" },
  { id: "green", name: "Green" },
  { id: "red", name: "Red" },
  { id: "space", name: "Space" },
  { id: "mountain", name: "Mountains" },
  { id: "forest", name: "Forest" },
  { id: "ocean", name: "Ocean" },
  { id: "night", name: "Night" }
];

// Define wallpapers with metadata
export const wallpapers: Wallpaper[] = [
  {
    id: "1",
    title: "Futuristic Space Ship",
    description: "futuristic space ship with vibrant colors",
    filename: "1.jpg",
    slug: "abstract-fluid-art",
    categoryId: "abstract",
    tags: ["4k", "gradient", "blue", "green"],
    views: 2340,
    downloads: 1120,
    featured: true,
    trending: true,
    uploadDate: "2023-12-01",
    resolution: "3840x2160"
  },
  {
    id: "2",
    title: "Akasa Demon Slayer",
    description: "Eye of akasa from demon slayer in which tanjiro's reflexion can be seen",
    filename: "2.jpg",
    slug: "mountain-landscape",
    categoryId: "nature",
    tags: ["4k", "mountain", "forest"],
    views: 1890,
    downloads: 980,
    featured: true,
    uploadDate: "2023-12-05",
    resolution: "3840x2160"
  },
  {
    id: "3",
    title: "Night Sky",
    description: "Starry night sky with silhouette of trees",
    filename: "3.jpg",
    slug: "night-sky",
    categoryId: "nature",
    tags: ["5k", "night", "space"],
    views: 3450,
    downloads: 1680,
    trending: true,
    uploadDate: "2023-12-10",
    resolution: "5120x2880"
  },
  {
    id: "4",
    title: "Geometric Shapes",
    description: "Minimalist geometric shapes on dark background",
    filename: "4.jpg",
    slug: "geometric-shapes",
    categoryId: "minimal",
    tags: ["4k", "dark", "black"],
    views: 2120,
    downloads: 1340,
    featured: true,
    uploadDate: "2023-12-15",
    resolution: "3840x2160"
  },
  {
    id: "5",
    title: "Urban Skyline",
    description: "City skyline at dusk with dramatic lighting",
    filename: "5.jpg",
    slug: "urban-skyline",
    categoryId: "architecture",
    tags: ["4k", "night", "dark"],
    views: 1780,
    downloads: 890,
    trending: true,
    uploadDate: "2023-12-20",
    resolution: "3840x2160"
  },
  {
    id: "6",
    title: "Deep Blue Ocean",
    description: "Deep blue ocean waves with underwater view",
    filename: "6.jpg",
    slug: "deep-blue-ocean",
    categoryId: "nature",
    tags: ["5k", "blue", "ocean"],
    views: 1980,
    downloads: 1220,
    featured: true,
    uploadDate: "2024-01-05",
    resolution: "5120x2880"
  },
  {
    id: "7",
    title: "Sports Car",
    description: "Luxury sports car on mountain road",
    filename: "7.jpg",
    slug: "sports-car",
    categoryId: "cars",
    tags: ["4k", "red"],
    views: 2780,
    downloads: 1480,
    trending: true,
    uploadDate: "2024-01-10",
    resolution: "3840x2160"
  },
  {
    id: "8",
    title: "Zen Garden",
    description: "Peaceful zen garden with stones and sand patterns",
    filename: "8.jpg",
    slug: "zen-garden",
    categoryId: "minimal",
    tags: ["4k", "green"],
    views: 1340,
    downloads: 760,
    uploadDate: "2024-01-15",
    resolution: "3840x2160"
  },
  {
    id: "9",
    title: "Space Exploration",
    description: "Futuristic space exploration with nebula and planets",
    filename: "9.jpg",
    slug: "space-exploration",
    categoryId: "space",
    tags: ["8k", "space", "dark"],
    views: 3980,
    downloads: 2240,
    featured: true,
    trending: true,
    uploadDate: "2024-01-20",
    resolution: "7680x4320"
  },
  {
    id: "10",
    title: "Black Minimalist",
    description: "Pure black minimalist design with subtle texture",
    filename: "10.jpg",
    slug: "black-minimalist",
    categoryId: "dark",
    tags: ["4k", "dark", "black"],
    views: 2870,
    downloads: 1890,
    trending: true,
    uploadDate: "2024-01-25",
    resolution: "3840x2160"
  }
];

// Continue adding metadata for the remaining wallpapers
for (let i = 11; i <= 40; i++) {
  const extension = "jpg"; // All files are jpg
  const categoryIndex = (i % 10);
  const category = categories[categoryIndex];
  const featured = i % 5 === 0;
  const trending = i % 7 === 0;
  
  // Use deterministic values based on wallpaper ID instead of random
  const views = 1000 + (i * 100);
  const downloads = 500 + (i * 50);
  
  wallpapers.push({
    id: i.toString(),
    title: `Wallpaper ${i}`,
    description: `Beautiful wallpaper number ${i}`,
    filename: `${i}.${extension}`,
    slug: `wallpaper-${i}`,
    categoryId: category.id,
    tags: [(i % 3 === 0) ? "4k" : (i % 3 === 1) ? "5k" : "8k", 
           tags[i % tags.length].id],
    views: views,
    downloads: downloads,
    featured,
    trending,
    uploadDate: new Date(2024, Math.floor(i/5), (i % 28) + 1).toISOString().split('T')[0],
    resolution: (i % 3 === 0) ? "3840x2160" : (i % 3 === 1) ? "5120x2880" : "7680x4320"
  });
}

// Update category counts
categories.forEach(category => {
  category.count = wallpapers.filter(w => w.categoryId === category.id).length;
});

// Utility functions
export function getWallpaperById(id: string): Wallpaper | undefined {
  return wallpapers.find(wallpaper => wallpaper.id === id);
}

export function getWallpaperBySlug(slug: string): Wallpaper | undefined {
  return wallpapers.find(wallpaper => wallpaper.slug === slug);
}

export function getWallpapersByCategory(categoryId: string): Wallpaper[] {
  return wallpapers.filter(wallpaper => wallpaper.categoryId === categoryId);
}

export function getWallpapersByTag(tagId: string): Wallpaper[] {
  return wallpapers.filter(wallpaper => wallpaper.tags.includes(tagId));
}

export function getFeaturedWallpapers(): Wallpaper[] {
  return wallpapers.filter(wallpaper => wallpaper.featured);
}

export function getTrendingWallpapers(): Wallpaper[] {
  return wallpapers.filter(wallpaper => wallpaper.trending);
}

export function getRecentWallpapers(count: number = 20): Wallpaper[] {
  return [...wallpapers].sort((a, b) => 
    new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  ).slice(0, count);
}

export function getPopularWallpapers(count: number = 20): Wallpaper[] {
  return [...wallpapers].sort((a, b) => b.downloads - a.downloads).slice(0, count);
}

export function getAllWallpapers(): Wallpaper[] {
  return wallpapers;
}

export function getCategoryById(id: string): WallpaperCategory | undefined {
  return categories.find(category => category.id === id);
}

export function getTagById(id: string): WallpaperTag | undefined {
  return tags.find(tag => tag.id === id);
}

export function searchWallpapers(query: string): Wallpaper[] {
  query = query.toLowerCase();
  return wallpapers.filter(wallpaper => 
    wallpaper.title.toLowerCase().includes(query) || 
    (wallpaper.description?.toLowerCase().includes(query)) ||
    wallpaper.tags.some(tag => tag.toLowerCase().includes(query)) ||
    getCategoryById(wallpaper.categoryId)?.name.toLowerCase().includes(query)
  );
} 

// Helper function to easily add new wallpapers
export function addNewWallpaper(
  id: number, 
  title: string, 
  description: string,
  categoryId: string,
  tags: string[] = ["4k"],
  featured: boolean = false,
  trending: boolean = false,
  resolution: string = "3840x2160"
) {
  const newId = id.toString();
  const filename = `${id}.jpg`;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  const newWallpaper: Wallpaper = {
    id: newId,
    title,
    description,
    filename,
    slug,
    categoryId,
    tags,
    views: 1000 + (id * 50),
    downloads: 500 + (id * 25),
    featured,
    trending,
    uploadDate: new Date().toISOString().split('T')[0],
    resolution
  };
  
  wallpapers.push(newWallpaper);
  
  // Update category count
  const category = getCategoryById(categoryId);
  if (category && category.count) {
    category.count += 1;
  }
  
  return newWallpaper;
}

// Usage example:
// To add more wallpapers, uncomment and modify these lines:
/*
addNewWallpaper(41, "Mountain Sunset", "Beautiful mountain sunset view", "nature", ["4k", "mountain"], true);
addNewWallpaper(42, "Ocean Waves", "Peaceful ocean waves at sunset", "nature", ["5k", "ocean"], false, true);
addNewWallpaper(43, "Cyberpunk City", "Futuristic cyberpunk cityscape", "abstract", ["4k", "dark"], true, true);
*/ 