"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch?: () => void;
  className?: string;
  placeholder?: string;
}

const SearchBar = ({ onSearch, className = "", placeholder = "Search wallpapers..." }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      if (onSearch) onSearch();
    }
  };

  return (
    <form onSubmit={handleSearch} className={`search-form ${className}`}>
      <div className="search-input-container">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
          placeholder={placeholder}
          aria-label="Search wallpapers"
        />
        <button type="submit" className="search-button">Search</button>
      </div>
    </form>
  );
};

export default SearchBar; 