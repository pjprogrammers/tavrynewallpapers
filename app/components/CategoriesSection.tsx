"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Layers, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Mock data - in a real application, this would come from an API
const categories = [
  {
    id: "nature",
    name: "Nature",
    count: 284,
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=500",
    color: "#4CAF50",
  },
  {
    id: "abstract",
    name: "Abstract",
    count: 182,
    image: "https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?q=80&w=500",
    color: "#9C27B0",
  },
  {
    id: "minimal",
    name: "Minimal",
    count: 143,
    image: "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?q=80&w=500",
    color: "#607D8B",
  },
  {
    id: "dark",
    name: "Dark",
    count: 198,
    image: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=500",
    color: "#212121",
  },
  {
    id: "neon",
    name: "Neon",
    count: 120,
    image: "https://images.unsplash.com/photo-1520262454473-a1a82276a574?q=80&w=500",
    color: "#FF4081",
  },
  {
    id: "architecture",
    name: "Architecture",
    count: 158,
    image: "https://images.unsplash.com/photo-1554435493-93422e8d1c46?q=80&w=500",
    color: "#795548",
  },
];

const CategoriesSection = () => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <Layers size={24} className="text-primary" />
            <h2 className="text-2xl font-bold">Browse Categories</h2>
          </div>
          <Link 
            href="/categories" 
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            View all <ChevronRight size={16} />
          </Link>
        </div>

        <div className="relative">
          {/* Navigation Buttons */}
          <motion.button 
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-md hover:bg-background hover:border-primary/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft size={20} />
          </motion.button>
          
          <motion.button 
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-md hover:bg-background hover:border-primary/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight size={20} />
          </motion.button>
          
          {/* Categories Slider */}
          <div 
            ref={sliderRef}
            className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none' }}
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="snap-start flex-shrink-0 w-[280px] h-[180px] overflow-hidden rounded-lg relative group"
              >
                <motion.div 
                  className="w-full h-full"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                >
                  <Image
                    src={category.image}
                    fill
                    alt={category.name}
                    className="object-cover"
                    sizes="280px"
                  />
                  <div 
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"
                  />
                  
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: `${category.color}25` }}
                  />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-lg">{category.name}</h3>
                    <p className="text-white/70 text-sm">{category.count} wallpapers</p>
                  </div>
                  
                  <motion.div 
                    className="absolute top-4 right-4 bg-primary/20 backdrop-blur-sm text-primary px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ opacity: 0, y: -10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                  >
                    Explore
                  </motion.div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection; 