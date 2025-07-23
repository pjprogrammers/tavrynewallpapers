"use client";

import { useState, useRef, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { Search } from "lucide-react";

const Hero = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    setIsInView(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Implement search functionality
      window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
    }
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-primary/20 blur-[10rem] animate-glow"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full bg-secondary/10 blur-[8rem] animate-glow"></div>
      </div>
      
      <div className="absolute inset-0 backdrop-blur-[100px] z-1"></div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 pt-16">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            variants={itemVariants}
          >
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Stunning Wallpapers
            </span>{" "}
            for Every Device
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Discover and download high-quality wallpapers that transform your screens.
            Our curated collection offers the perfect backdrop for your digital life.
          </motion.p>

          <motion.form 
            onSubmit={handleSearch} 
            className="relative max-w-xl mx-auto"
            variants={itemVariants}
          >
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for wallpapers..."
              className="w-full h-14 pl-5 pr-16 rounded-full input text-lg border-primary/20 focus:border-primary shadow-lg shadow-primary/5"
              aria-label="Search for wallpapers"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bg-gradient-to-r from-primary-dark to-primary text-black h-10 w-10 rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-primary/20 transition-shadow"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
          </motion.form>

          <motion.div 
            className="flex flex-wrap gap-2 justify-center mt-6"
            variants={itemVariants}
          >
            <span className="text-sm text-foreground/60">Popular:</span>
            {["Nature", "Abstract", "Minimal", "Dark", "Neon"].map((tag) => (
              <a
                key={tag}
                href={`/search?q=${tag}`}
                className="text-sm text-foreground/80 hover:text-primary transition-colors"
              >
                #{tag}
              </a>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <motion.div 
        className="absolute bottom-10 left-10 w-24 h-24 border border-primary/20 rounded-full hidden md:block"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
      <motion.div 
        className="absolute top-32 right-20 w-16 h-16 border border-primary/20 rounded-full hidden md:block"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
      />
    </section>
  );
};

export default Hero; 