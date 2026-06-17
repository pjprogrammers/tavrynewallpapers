"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  Menu,
  X,
  Heart,
  Home,
  Image as ImageIcon,
  Grid,
  LogOut,
  UserPlus,
  User,
  Settings,
  Shield,
  ChevronDown,
  TrendingUp,
  Upload,
  Download,
  Clock,
  Layers,
  List,
  Tag,
} from "lucide-react";
import SearchBar from "./SearchBar";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { signOut as firebaseSignOut } from "@/lib/auth";

const Header = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const isAdmin = roles.admin === true;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /**
   * Generate a reliable avatar URL:
   * - Uses user's photoURL if available
   * - Falls back to a DiceBear initial avatar based on display name or email
   */
  const avatarUrl = useMemo(() => {
    if (user?.photoURL) return user.photoURL;
    // Default fallback to local avatar
    return "/avatars_preset/aiden.svg";
  }, [user]);

  /**
   * Handle header scroll effect
   */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * Close menus when pathname changes
   */
  useEffect(() => {
    setIsMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  /**
   * Close dropdown on escape key
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && userMenuOpen) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [userMenuOpen]);

  /**
   * Toggle mobile menu
   */
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
    if (!isMenuOpen) setSearchOpen(false);
  };

  /**
   * Toggle search panel
   */
  const toggleSearch = () => {
    setSearchOpen((prev) => !prev);
    if (!searchOpen) setIsMenuOpen(false);
  };

  /**
   * Toggle user dropdown
   */
  const toggleUserMenu = () => {
    setUserMenuOpen((prev) => !prev);
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
   * Handle menu item click
   */
  const handleMenuItemClick = () => {
    setUserMenuOpen(false);
  };

  /**
   * Check active routes
   */
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
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
          <Link href="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
            <Home size={18} className="nav-icon" />
            <span>Home</span>
          </Link>
          <Link
            href="/categories/all"
            className={`nav-link ${isActive("/categories") ? "active" : ""}`}
          >
            <Grid size={18} className="nav-icon" />
            <span>Categories</span>
          </Link>
          <Link
            href="/featured"
            className={`nav-link ${isActive("/featured") ? "active" : ""}`}
          >
            <ImageIcon size={18} className="nav-icon" />
            <span>Featured</span>
          </Link>
          <div className="nav-dropdown">
            <button
              className="nav-link nav-dropdown-trigger"
              type="button"
              aria-haspopup="true"
            >
              <Layers size={18} className="nav-icon" />
              <span>Browse</span>
              <ChevronDown size={14} className="nav-dropdown-chevron" />
            </button>
            <div className="nav-dropdown-menu">
              <Link href="/popular" className="nav-dropdown-item">
                <TrendingUp size={16} />
                <span>Popular</span>
              </Link>
              <Link href="/recent" className="nav-dropdown-item">
                <Clock size={16} />
                <span>Recent</span>
              </Link>
              <Link href="/all" className="nav-dropdown-item">
                <List size={16} />
                <span>All Wallpapers</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Desktop Actions */}
        <div className="desktop-actions">
          {/* Search */}
          <button
            className={`header-icon-button ${searchOpen ? "active" : ""}`}
            onClick={toggleSearch}
            aria-label="Search"
            type="button"
          >
            <Search size={20} />
          </button>

          {/* Favorites */}
          <Link
            href="/favorites"
            className={`header-icon-button ${isActive("/favorites") ? "active" : ""}`}
            aria-label="Favorites"
          >
            <Heart size={20} />
          </Link>

          {/* User Menu / Auth */}
          {user ? (
            <div className="user-menu-container">
              <button
                ref={buttonRef}
                onClick={toggleUserMenu}
                className={`user-menu-trigger ${userMenuOpen ? "active" : ""}`}
                aria-label="User menu"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                type="button"
              >
                <Image
                  src={avatarUrl}
                  alt="User avatar"
                  width={32}
                  height={32}
                  unoptimized
                  className="user-avatar"
                />
                <ChevronDown
                  size={14}
                  className={`user-menu-chevron ${userMenuOpen ? "open" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              <div
                ref={menuRef}
                className={`user-dropdown ${userMenuOpen ? "open" : ""}`}
                role="menu"
              >
                <div className="user-dropdown-header">
                  <Image
                    src={avatarUrl}
                    alt="User avatar"
                    width={44}
                    height={44}
                    unoptimized
                    className="user-dropdown-avatar"
                  />
                  <div className="user-dropdown-info">
                    <span className="user-dropdown-name">
                      {user.displayName || "User"}
                    </span>
                    <span className="user-dropdown-email">
                      {user.email ?? ""}
                    </span>
                  </div>
                </div>

                <div className="user-dropdown-items">
                  <Link
                    href="/profile"
                    className="user-dropdown-item"
                    onClick={handleMenuItemClick}
                    role="menuitem"
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/favorites"
                    className="user-dropdown-item"
                    onClick={handleMenuItemClick}
                    role="menuitem"
                  >
                    <Heart size={16} />
                    <span>Favorites</span>
                  </Link>
                  <Link
                    href="/downloads"
                    className="user-dropdown-item"
                    onClick={handleMenuItemClick}
                    role="menuitem"
                  >
                    <Download size={16} />
                    <span>Downloads</span>
                  </Link>
                  <Link
                    href="/upload"
                    className="user-dropdown-item"
                    onClick={handleMenuItemClick}
                    role="menuitem"
                  >
                    <Upload size={16} />
                    <span>Upload</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="user-dropdown-item user-dropdown-admin"
                      onClick={handleMenuItemClick}
                      role="menuitem"
                    >
                      <Shield size={16} />
                      <span>Admin</span>
                    </Link>
                  )}
                </div>

                <div className="user-dropdown-footer">
                  <button
                    onClick={handleLogout}
                    className="user-dropdown-item user-dropdown-logout"
                    role="menuitem"
                  >
                    <LogOut size={16} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="header-auth-buttons">
              <Link href="/login" className="header-signin-btn">
                <User size={16} />
                <span>Sign In</span>
              </Link>
              <Link href="/signup" className="header-signup-btn">
                <UserPlus size={16} />
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleMenu}
          className="mobile-menu-toggle"
          aria-label="Toggle menu"
          type="button"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Search Panel */}
      <div className={`search-panel ${searchOpen ? "open" : ""}`}>
        <div className="container">
          <SearchBar onSearch={() => setSearchOpen(false)} />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${isMenuOpen ? "open" : ""}`}>
        <div className="container">
          <nav className="mobile-nav-menu">
            {/* Auth Section - Sign Up/Login or User Profile */}
            {!user ? (
              <>
                <Link
                  href="/signup"
                  className="mobile-nav-link mobile-nav-auth"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserPlus size={20} className="mobile-nav-icon" />
                  <span>Sign Up</span>
                </Link>
                <Link
                  href="/login"
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={20} className="mobile-nav-icon" />
                  <span>Sign In</span>
                </Link>
                <div className="mobile-nav-divider" />
              </>
            ) : (
              <>
                <Link
                  href="/profile"
                  className="mobile-nav-link mobile-nav-user"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Image src={avatarUrl} alt="Profile" width={36} height={36} unoptimized className="mobile-nav-avatar" />
                  <span>Your Profile</span>
                </Link>
                <div className="mobile-nav-divider" />
              </>
            )}

            <Link
              href="/"
              className={`mobile-nav-link ${isActive("/") ? "active" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Home size={20} className="mobile-nav-icon" />
              <span>Home</span>
            </Link>

            <Link
              href="/categories/all"
              className={`mobile-nav-link ${
                isActive("/categories") ? "active" : ""
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Grid size={20} className="mobile-nav-icon" />
              <span>Categories</span>
            </Link>

            <Link
              href="/featured"
              className={`mobile-nav-link ${
                isActive("/featured") ? "active" : ""
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <ImageIcon size={20} className="mobile-nav-icon" />
              <span>Featured</span>
            </Link>

            <Link
              href="/popular"
              className={`mobile-nav-link ${
                isActive("/popular") ? "active" : ""
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <TrendingUp size={20} className="mobile-nav-icon" />
              <span>Popular</span>
            </Link>

            <Link
              href="/recent"
              className={`mobile-nav-link ${isActive("/recent") ? "active" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Clock size={20} className="mobile-nav-icon" />
              <span>Recent</span>
            </Link>
            <Link
              href="/all"
              className={`mobile-nav-link ${isActive("/all") ? "active" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Tag size={20} className="mobile-nav-icon" />
              <span>All Wallpapers</span>
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className={`mobile-nav-link mobile-nav-link-admin ${isActive("/admin") ? "active" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Shield size={20} className="mobile-nav-icon" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            <div className="mobile-nav-divider" />

            {user && (
              <>
                <Link
                  href="/downloads"
                  className={`mobile-nav-link ${
                    isActive("/downloads") ? "active" : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Download size={20} className="mobile-nav-icon" />
                  <span>Downloads</span>
                </Link>

                <Link
                  href="/favorites"
                  className={`mobile-nav-link ${
                    isActive("/favorites") ? "active" : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Heart size={20} className="mobile-nav-icon" />
                  <span>Favorites</span>
                </Link>

                <Link
                  href="/upload"
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Upload size={20} className="mobile-nav-icon" />
                  <span>Upload</span>
                </Link>

                <div className="mobile-nav-divider" />
              </>
            )}

            <button
              className="mobile-search-button"
              onClick={() => {
                setIsMenuOpen(false);
                setTimeout(() => setSearchOpen(true), 300);
              }}
              type="button"
            >
              <Search size={20} />
              <span>Search</span>
            </button>

            {/* Logout button for logged in users */}
            {user && (
              <>
                <div className="mobile-nav-divider" />
                <button
                  className="mobile-nav-link mobile-nav-logout"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  type="button"
                >
                  <LogOut size={20} className="mobile-nav-icon" />
                  <span>Sign Out</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;