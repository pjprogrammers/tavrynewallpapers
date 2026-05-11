"use client";

import { useState, useEffect } from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  Search,
  Menu,
  X,
  Heart,
  Download,
  Home,
  Image as ImageIcon,
  Grid,
  Tag,
  LogOut,
  UserPlus,
} from "lucide-react";

import SearchBar from "./SearchBar";

import { useAuth } from "@/lib/auth-context";

import { signOut as firebaseSignOut } from "@/lib/auth";

const Header = () => {
  const pathname = usePathname();

  const { user } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  /**
   * Handle header scroll effect
   */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /**
   * Close menus when pathname changes
   */
  useEffect(() => {
    setIsMenuOpen(false);

    setUserMenuOpen(false);
  }, [pathname]);

  /**
   * Toggle mobile menu
   */
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);

    if (!isMenuOpen) {
      setSearchOpen(false);
    }
  };

  /**
   * Toggle search panel
   */
  const toggleSearch = () => {
    setSearchOpen((prev) => !prev);

    if (!searchOpen) {
      setIsMenuOpen(false);
    }
  };

  /**
   * Logout handler
   */
  const handleLogout = async () => {
    try {
      await firebaseSignOut();

      setUserMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  /**
   * Check active routes
   */
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(path);
  };

  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
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
            className={`nav-link ${isActive("/") ? "active" : ""}`}
          >
            <Home size={18} className="nav-icon" />

            <span>Home</span>
          </Link>

          <Link
            href="/categories/all"
            className={`nav-link ${
              isActive("/categories") ? "active" : ""
            }`}
          >
            <Grid size={18} className="nav-icon" />

            <span>Categories</span>
          </Link>

          <Link
            href="/featured"
            className={`nav-link ${
              isActive("/featured") ? "active" : ""
            }`}
          >
            <ImageIcon size={18} className="nav-icon" />

            <span>Featured</span>
          </Link>

          <Link
            href="/all"
            className={`nav-link ${isActive("/all") ? "active" : ""}`}
          >
            <Tag size={18} className="nav-icon" />

            <span>All Wallpapers</span>
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="desktop-actions">
          {/* Search */}
          <button
            className={`header-icon-button ${
              searchOpen ? "active" : ""
            }`}
            onClick={toggleSearch}
            aria-label="Search"
            type="button"
          >
            <Search size={20} />
          </button>

          {/* Downloads */}
          <Link
            href="/downloads"
            className={`header-icon-button ${
              isActive("/downloads") ? "active" : ""
            }`}
            aria-label="Downloads"
          >
            <Download size={20} />
          </Link>

          {/* Favorites */}
          <Link
            href="/favorites"
            className={`header-icon-button ${
              isActive("/favorites") ? "active" : ""
            }`}
            aria-label="Favorites"
          >
            <Heart size={20} />
          </Link>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() =>
                user
                  ? setUserMenuOpen((prev) => !prev)
                  : null
              }
              className="header-icon-button relative flex items-center"
              aria-label="User menu"
              type="button"
            >
              {user ? (
                <>
                  <img
                    src={
                      user.photoURL || "/globe.svg"
                    }
                    alt="User avatar"
                    className="h-8 w-8 rounded-full border border-primary/20"
                  />

                  <span className="ml-2 hidden md:inline-block">
                    {user.displayName?.split(" ")[0] || "User"}
                  </span>
                </>
              ) : (
                <Link href="/signup">
                  <UserPlus size={20} />
                </Link>
              )}
            </button>

            {/* Dropdown */}
            {user && userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-card shadow-lg z-50">
                <div className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        user.photoURL ||
                        "/default-avatar.png"
                      }
                      alt="User avatar"
                      className="h-10 w-10 rounded-full border border-primary/20"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {user.displayName || "User"}
                      </p>

                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border" />

                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-3 px-4 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    type="button"
                  >
                    <LogOut size={18} />

                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleMenu}
          className="mobile-menu-toggle"
          aria-label="Toggle menu"
          type="button"
        >
          {isMenuOpen ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>
      </div>

      {/* Search Panel */}
      <div
        className={`search-panel ${
          searchOpen ? "open" : ""
        }`}
      >
        <div className="container">
          <SearchBar
            onSearch={() => setSearchOpen(false)}
          />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`mobile-nav ${
          isMenuOpen ? "open" : ""
        }`}
      >
        <div className="container">
          <nav className="mobile-nav-menu">
            <Link
              href="/"
              className={`mobile-nav-link ${
                isActive("/") ? "active" : ""
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Home
                size={20}
                className="mobile-nav-icon"
              />

              <span>Home</span>
            </Link>

            <Link
              href="/categories/all"
              className={`mobile-nav-link ${
                isActive("/categories")
                  ? "active"
                  : ""
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Grid
                size={20}
                className="mobile-nav-icon"
              />

              <span>Categories</span>
            </Link>

            <Link
              href="/featured"
              className={`mobile-nav-link ${
                isActive("/featured")
                  ? "active"
                  : ""
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <ImageIcon
                size={20}
                className="mobile-nav-icon"
              />

              <span>Featured</span>
            </Link>

            <Link
              href="/all"
              className={`mobile-nav-link ${
                isActive("/all") ? "active" : ""
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Tag
                size={20}
                className="mobile-nav-icon"
              />

              <span>All Wallpapers</span>
            </Link>

            <div className="mobile-nav-divider" />

            <Link
              href="/downloads"
              className={`mobile-nav-link ${
                isActive("/downloads")
                  ? "active"
                  : ""
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Download
                size={20}
                className="mobile-nav-icon"
              />

              <span>Downloads</span>
            </Link>

            <Link
              href="/favorites"
              className={`mobile-nav-link ${
                isActive("/favorites")
                  ? "active"
                  : ""
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Heart
                size={20}
                className="mobile-nav-icon"
              />

              <span>Favorites</span>
            </Link>

            <div className="mobile-nav-divider" />

            <button
              className="mobile-search-button"
              onClick={() => {
                setIsMenuOpen(false);

                setTimeout(() => {
                  setSearchOpen(true);
                }, 300);
              }}
              type="button"
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