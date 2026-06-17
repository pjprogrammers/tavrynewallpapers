"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Heart, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserFavorites } from "@/lib/use-firestore";
import { toggleFavorite } from "@/lib/firestore";
import { createSlug } from "@/lib/slug";
import type { Favorite } from "@/lib/firestore-types";

export const FavoritesContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading: favoritesLoading, removeFavorite } = useUserFavorites();

  const handleRemove = async (e: React.MouseEvent, favorite: Favorite) => {
    e.preventDefault();
    e.stopPropagation();

    // Remove from favorites (toggleFavorite handles removal)
    if (user) {
      await toggleFavorite(user.uid, favorite.wallpaperId);
    }
  };

  if (authLoading || favoritesLoading) {
    return (
      <div className="favorites-page" style={{ minHeight: "60vh" }}>
        <div className="page-header">
          <h1>Your Favorites</h1>
          <p>Loading...</p>
        </div>
        <div className="cards-grid-skeleton">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-required">
        <Heart size={64} className="icon-large" />
        <h1>Sign in to view your favorites</h1>
        <p>Create an account or sign in to save your favorite wallpapers.</p>
        <div className="auth-buttons">
          <Link href="/login" className="btn btn-primary">
            Sign In
          </Link>
          <Link href="/signup" className="btn btn-secondary">
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="empty-state">
        <Heart size={64} className="icon-large" />
        <h1>No favorites yet</h1>
        <p>Start exploring and add wallpapers to your favorites!</p>
        <Link href="/" className="btn btn-primary">
          Browse Wallpapers
        </Link>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="page-header">
        <h1>Your Favorites</h1>
        <p>{favorites.length} wallpaper{favorites.length !== 1 ? "s" : ""} saved</p>
      </div>

      <div className="cards-grid">
        {favorites.map((favorite, index) => (
          <FavoriteCard
            key={favorite.id}
            favorite={favorite}
            onRemove={handleRemove}
            priority={index < 4}
          />
        ))}
      </div>
    </div>
  );
};

interface FavoriteCardProps {
  favorite: Favorite;
  onRemove: (e: React.MouseEvent, favorite: Favorite) => void;
  priority?: boolean;
}

const FavoriteCard = ({ favorite, onRemove, priority = false }: FavoriteCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const createdAt = favorite.createdAt;
  const createdDate = !createdAt
    ? new Date()
    : createdAt instanceof Date
      ? createdAt
      : new Date((createdAt as any).seconds * 1000);

  const formattedDate = createdDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="glass-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/wallpaper/${favorite.wallpaperId}/${createSlug(favorite.wallpaperTitle)}`} className="glass-card-link">
        {/* Background Image */}
        <div className="glass-card-image">
          <Image
            src={favorite.wallpaperThumbnail || `/wallpapers/${favorite.wallpaperId}.jpg`}
            alt={favorite.wallpaperTitle}
            fill
            className={`glass-card-img ${isHovered ? "blurred" : ""}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
          />
        </div>

        {/* Glass Overlay */}
        <div className={`glass-card-overlay ${isHovered ? "active" : ""}`}>
          <div className="glass-card-content">
            <div className="glass-card-header">
              <h3 className="glass-card-title">{favorite.wallpaperTitle}</h3>
            </div>

            <div className="glass-card-meta">
              <span className="glass-card-meta-item">
                <Calendar size={14} />
                {formattedDate}
              </span>
            </div>

            <div className="glass-card-actions">
              <button
                onClick={(e) => onRemove(e, favorite)}
                className="glass-card-btn glass-card-btn-danger"
                title="Remove from favorites"
              >
                <Trash2 size={18} />
                Remove
              </button>
            </div>
          </div>
        </div>

        {/* Default Info (shown when not hovering) */}
        <div className={`glass-card-default ${isHovered ? "hidden" : ""}`}>
          <Heart size={20} className="glass-card-default-icon" />
          <span className="glass-card-default-title">{favorite.wallpaperTitle}</span>
        </div>
      </Link>
    </div>
  );
};

export default FavoritesContent;
