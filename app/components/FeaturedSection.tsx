"use client";

import { motion } from "framer-motion";
import { ChevronRight, TrendingUp } from "lucide-react";
import WallpaperCard from "./WallpaperCard";
import Link from "next/link";

// Mock data - in a real application, this would come from an API
const featuredWallpapers = [
  {
    id: "1",
    title: "Mountain Peaks",
    imageSrc: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000",
    author: "Nature Explorer",
    likes: 1240,
    downloads: 890,
    category: "Nature"
  },
  {
    id: "2",
    title: "Neon City",
    imageSrc: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000",
    author: "Urban Shots",
    likes: 980,
    downloads: 650,
    category: "Abstract"
  },
  {
    id: "3",
    title: "Minimal Geometry",
    imageSrc: "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?q=80&w=1000",
    author: "Design Studio",
    likes: 876,
    downloads: 542,
    category: "Minimal"
  },
  {
    id: "4",
    title: "Ocean Waves",
    imageSrc: "https://images.unsplash.com/photo-1518623489648-a173ef7824f3?q=80&w=1000",
    author: "Sea Lover",
    likes: 1120,
    downloads: 734,
    category: "Nature"
  }
];

const FeaturedSection = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <TrendingUp size={24} className="text-primary" />
            <h2 className="text-2xl font-bold">Featured Wallpapers</h2>
          </div>
          <Link 
            href="/featured" 
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            View all <ChevronRight size={16} />
          </Link>
        </div>
        
        <motion.div 
          className="wallpaper-grid"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          {featuredWallpapers.map((wallpaper) => (
            <WallpaperCard
              key={wallpaper.id}
              id={wallpaper.id}
              title={wallpaper.title}
              imageSrc={wallpaper.imageSrc}
              author={wallpaper.author}
              likes={wallpaper.likes}
              downloads={wallpaper.downloads}
              category={wallpaper.category}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedSection; 