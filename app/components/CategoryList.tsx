"use client";

import { useState } from "react";
import Link from "next/link";
import { WallpaperCategory } from "../lib/wallpapers";

interface CategoryListProps {
  categories: WallpaperCategory[];
  selectedCategory?: string;
}

const CategoryList = ({ categories, selectedCategory }: CategoryListProps) => {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(selectedCategory);

  return (
    <div className="categories-list hide-scrollbar">
      <Link 
        href="/categories/all" 
        className={`category-pill ${activeCategory === undefined || activeCategory === 'all' ? 'active' : ''}`}
        onClick={() => setActiveCategory('all')}
      >
        All
      </Link>
      {categories.map((category) => (
        <Link 
          key={category.id} 
          href={`/categories/${category.id}`} 
          className={`category-pill ${activeCategory === category.id ? 'active' : ''}`}
          onClick={() => setActiveCategory(category.id)}
        >
          {category.name} {category.count && <span>({category.count})</span>}
        </Link>
      ))}
    </div>
  );
};

export default CategoryList; 