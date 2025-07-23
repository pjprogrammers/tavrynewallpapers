"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X, Heart, Download, Home, Image as ImageIcon, Grid, Tag } from "lucide-react";
import SearchBar from "./SearchBar";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  
  // Handle scroll events for header transparency and animation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      setSearchOpen(false);
    }
  };
  
  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (!searchOpen) {
      setIsMenuOpen(false);
    }
  };
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-container">
        {/* Logo */}
        <Link href="/" className="site-logo">
          <span className="logo-text">
            <span className="logo-primary">Tavryne</span>
            <span className="logo-secondary">Wallpapers</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link 
            href="/" 
            className={`nav-link ${isActive('/') && !isActive('/categories') && !isActive('/featured') && !isActive('/all') ? 'active' : ''}`}
          >
            <Home size={18} className="nav-icon" />
            <span>Home</span>
          </Link>
          <Link 
            href="/categories/all" 
            className={`nav-link ${isActive('/categories') ? 'active' : ''}`}
          >
            <Grid size={18} className="nav-icon" />
            <span>Categories</span>
          </Link>
          <Link 
            href="/featured" 
            className={`nav-link ${isActive('/featured') ? 'active' : ''}`}
          >
            <ImageIcon size={18} className="nav-icon" />
            <span>Featured</span>
          </Link>
          <Link 
            href="/all" 
            className={`nav-link ${isActive('/all') ? 'active' : ''}`}
          >
            <Tag size={18} className="nav-icon" />
            <span>All Wallpapers</span>
          </Link>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="desktop-actions">
          <button 
            className={`header-icon-button ${searchOpen ? 'active' : ''}`}
            onClick={toggleSearch}
            aria-label="Search"
          >
            <Search size={20} />
          </button>
          <Link 
            href="/downloads" 
            className={`header-icon-button ${isActive('/downloads') ? 'active' : ''}`}
            aria-label="Downloads"
          >
            <Download size={20} />
          </Link>
          <Link 
            href="/favorites" 
            className={`header-icon-button ${isActive('/favorites') ? 'active' : ''}`}
            aria-label="Favorites"
          >
            <Heart size={20} />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="mobile-menu-toggle"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Search Panel */}
      <div className={`search-panel ${searchOpen ? 'open' : ''}`}>
        <div className="container">
          <SearchBar onSearch={() => setSearchOpen(false)} />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}>
        <div className="container">
          <nav className="mobile-nav-menu">
            <Link 
              href="/" 
              className={`mobile-nav-link ${isActive('/') && !isActive('/categories') && !isActive('/featured') && !isActive('/all') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Home size={20} className="mobile-nav-icon" />
              <span>Home</span>
            </Link>
            <Link 
              href="/categories/all" 
              className={`mobile-nav-link ${isActive('/categories') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Grid size={20} className="mobile-nav-icon" />
              <span>Categories</span>
            </Link>
            <Link 
              href="/featured" 
              className={`mobile-nav-link ${isActive('/featured') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <ImageIcon size={20} className="mobile-nav-icon" />
              <span>Featured</span>
            </Link>
            <Link 
              href="/all" 
              className={`mobile-nav-link ${isActive('/all') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Tag size={20} className="mobile-nav-icon" />
              <span>All Wallpapers</span>
            </Link>
            <div className="mobile-nav-divider"></div>
            <Link 
              href="/downloads"
              className={`mobile-nav-link ${isActive('/downloads') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Download size={20} className="mobile-nav-icon" />
              <span>Downloads</span>
            </Link>
            <Link 
              href="/favorites"
              className={`mobile-nav-link ${isActive('/favorites') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Heart size={20} className="mobile-nav-icon" />
              <span>Favorites</span>
            </Link>
            <div className="mobile-nav-divider"></div>
            <button 
              className="mobile-search-button"
              onClick={() => {
                setIsMenuOpen(false);
                setTimeout(() => setSearchOpen(true), 300);
              }}
            >
              <Search size={20} />
              <span>Search</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;