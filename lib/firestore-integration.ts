/**
 * 📚 FIRESTORE INTEGRATION GUIDE
 * ==============================
 *
 * This file demonstrates how to use the Firestore integration
 * in your Next.js wallpaper platform.
 *
 * File Structure:
 * - lib/firebase.ts          → Firebase initialization
 * - lib/firestore-types.ts   → TypeScript interfaces
 * - lib/firestore.ts         → All Firestore operations
 * - lib/use-firestore.ts      → React hooks for easy use
 *
 * Firestore Collection Structure:
 * - users/{uid}                    → User profiles
 * - wallpapers/{wallpaperId}       → Wallpaper metadata
 * - wallpaperStats/{wallpaperId}  → View/download/like counts
 * - favorites/{userId_wallpaperId} → User favorites (flat structure)
 * - likes/{userId_wallpaperId}     → User likes (flat structure)
 * - downloads/{downloadId}         → Download records
 * - wallpapers/{id}/views/{viewId} → View records per wallpaper
 */

/* =========================================================
   🎯 QUICK START EXAMPLES
========================================================= */

/* ------------------------------------------------------------------
   1️⃣ SYNC USER ON LOGIN (Already integrated in auth.ts)
------------------------------------------------------------------ */
// When user logs in/up, their profile is automatically created/updated:
// This is handled in auth.ts via createUserDocument() and upsertUserDocument()

/* ------------------------------------------------------------------
   2️⃣ GET USER PROFILE
------------------------------------------------------------------ */
import { useUserProfile } from "./use-firestore";

// In a component:
/*
function UserProfileComponent() {
  const { profile, loading, updateProfile } = useUserProfile();

  if (loading) return <div>Loading...</div>;

  if (!profile) return <div>Not signed in</div>;

  return (
    <div>
      <img src={profile.photoURL} alt={profile.displayName} />
      <h1>{profile.displayName}</h1>
      <p>{profile.email}</p>
      <p>Joined: {profile.createdAt.toDate().toLocaleDateString()}</p>
    </div>
  );
}
*/

/* ------------------------------------------------------------------
   3️⃣ WALLPAPER WITH REALTIME STATS
------------------------------------------------------------------ */
import { useRealtimeWallpaperStats } from "./use-firestore";

/*
function WallpaperStats({ wallpaperId }: { wallpaperId: string }) {
  // This updates in real-time when stats change
  const stats = useRealtimeWallpaperStats(wallpaperId);

  if (!stats) return <div>Loading stats...</div>;

  return (
    <div>
      <span>👁️ {stats.views.toLocaleString()} views</span>
      <span>❤️ {stats.likes.toLocaleString()} likes</span>
      <span>⬇️ {stats.downloads.toLocaleString()} downloads</span>
    </div>
  );
}
*/

/* ------------------------------------------------------------------
   4️⃣ LIKE/UNLIKE TOGGLE
------------------------------------------------------------------ */
import { useLike } from "./use-firestore";

/*
function LikeButton({ wallpaperId }: { wallpaperId: string }) {
  const { isLiked, loading, toggle } = useLike(wallpaperId);

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={isLiked ? "liked" : ""}
    >
      {isLiked ? "❤️ Liked" : "🤍 Like"}
    </button>
  );
}
*/

/* ------------------------------------------------------------------
   5️⃣ FAVORITE/UNFAVORITE TOGGLE
------------------------------------------------------------------ */
import { useFavorite } from "./use-firestore";

/*
function FavoriteButton({ wallpaper }: { wallpaper: WallpaperMetadata }) {
  const { isFavorited, loading, toggle } = useFavorite(wallpaper.id, {
    slug: wallpaper.slug,
    title: wallpaper.title,
    thumbnail: `/wallpapers/${wallpaper.filename}`,
  });

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={isFavorited ? "favorited" : ""}
    >
      {isFavorited ? "⭐ Favorited" : "☆ Add to Favorites"}
    </button>
  );
}
*/

/* ------------------------------------------------------------------
   6️⃣ RECORD DOWNLOAD
------------------------------------------------------------------ */
import { useDownload } from "./use-firestore";

/*
function DownloadButton({ wallpaper }: { wallpaper: WallpaperMetadata }) {
  const { loading, download } = useDownload(wallpaper.id, wallpaper.slug);

  const handleDownload = async (resolution: string) => {
    // Record the download in Firestore
    await download(resolution, "monitor");

    // Open the actual download URL (GitHub raw URL or your CDN)
    window.open(`https://raw.githubusercontent.com/your-repo/wallpapers/${wallpaper.filename}`, "_blank");
  };

  return (
    <div>
      <button onClick={() => handleDownload("3840x2160")} disabled={loading}>
        ⬇️ Download Original (3840x2160)
      </button>
      <button onClick={() => handleDownload("1920x1080")} disabled={loading}>
        ⬇️ Download Desktop (1920x1080)
      </button>
    </div>
  );
}
*/

/* ------------------------------------------------------------------
   7️⃣ USER FAVORITES LIST (Realtime)
------------------------------------------------------------------ */
import { useUserFavorites } from "./use-firestore";

/*
function FavoritesPage() {
  const { favorites, loading } = useUserFavorites();

  if (loading) return <div>Loading favorites...</div>;

  if (favorites.length === 0) {
    return <div>No favorites yet!</div>;
  }

  return (
    <div className="favorites-grid">
      {favorites.map((favorite) => (
        <div key={favorite.id} className="favorite-item">
          <img src={favorite.wallpaperThumbnail} alt={favorite.wallpaperTitle} />
          <h3>{favorite.wallpaperTitle}</h3>
          <span>{favorite.createdAt.toDate().toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}
*/

/* ------------------------------------------------------------------
   8️⃣ USER LIKES WITH O(1) LOOKUP
------------------------------------------------------------------ */
import { useUserLikes } from "./use-firestore";

/*
function WallpaperGrid({ wallpapers }: { wallpapers: WallpaperMetadata[] }) {
  const { likedIds, isLikedById } = useUserLikes();

  return (
    <div className="wallpaper-grid">
      {wallpapers.map((wallpaper) => (
        <div key={wallpaper.id} className="wallpaper-card">
          <img src={`/wallpapers/${wallpaper.filename}`} alt={wallpaper.title} />
          <span>{wallpaper.title}</span>
          {isLikedById(wallpaper.id) && <span>❤️</span>}
        </div>
      ))}
    </div>
  );
}
*/

/* ------------------------------------------------------------------
   9️⃣ RECORD VIEW ON WALLPAPER PAGE
------------------------------------------------------------------ */
import { useEffect } from "react";
import { recordView } from "./firestore";
import { useAuth } from "./auth-context";

/*
function WallpaperPageContent({ wallpaper }: { wallpaper: WallpaperMetadata }) {
  const { user } = useAuth();

  useEffect(() => {
    // Record view when component mounts
    recordView({
      userId: user?.uid,
      wallpaperId: wallpaper.id,
      deviceInfo: {
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
      },
    });
  }, [wallpaper.id, user?.uid]);

  return <div>Wallpaper content...</div>;
}
*/

/* ------------------------------------------------------------------
   🔟 ATOMIC COUNTER OPERATIONS
------------------------------------------------------------------ */
import {
  incrementViewCount,
  incrementDownloadCount,
} from "./firestore";

/*
// Instead of reading current count, incrementing, and writing back,
// use atomic increment operations:

// When a view happens:
await incrementViewCount("wallpaper_id_123");

// When a download happens:
await incrementDownloadCount("wallpaper_id_123");

// These are atomic and prevent race conditions in concurrent environments!
*/

/* ------------------------------------------------------------------
   1️⃣1️⃣ BATCH OPERATIONS
------------------------------------------------------------------ */
import { batchGetWallpaperStats, checkMultipleLikes } from "./firestore";

/*
// Get stats for multiple wallpapers at once
const wallpaperIds = ["id1", "id2", "id3", "id4", "id5"];
const statsMap = await batchGetWallpaperStats(wallpaperIds);

// statsMap is a Map<string, WallpaperStats>
// Access like: statsMap.get("id1")?.downloads

// Check if user has liked multiple wallpapers
const userId = "user_123";
const likesMap = await checkMultipleLikes(userId, wallpaperIds);
// likesMap is a Map<string, boolean>
// Access like: likesMap.get("id1") === true
*/

/* =========================================================
   🏗️ SCALABLE ARCHITECTURE NOTES
========================================================= */

/*
Why flat structure for favorites/likes?
---------------------------------------
Instead of: users/{uid}/favorites/{favoriteId}
We use:     favorites/{uid_wallpaperId}

Benefits:
1. O(1) duplicate check - just check if document exists
2. No deep nested queries
3. Easy to batch read all user's favorites
4. Easy to batch check multiple favorites at once
5. Firestore query limits don't bite as hard

Atomic Counters for Stats
-------------------------
We store stats in a separate document: wallpaperStats/{wallpaperId}

Instead of:
  doc.likes += 1  // Read-modify-write (race condition!)

We use:
  updateDoc(doc, { likes: increment(1) })  // Atomic server-side increment

This prevents race conditions when thousands of users
like the same wallpaper simultaneously.
*/

/* =========================================================
   🔐 SECURITY RULES (Add to Firestore Rules)
========================================================= */

/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // USERS
    match /users/{userId} {
      allow read: if true;  // Public profiles
      allow write: if isAuthenticated() && isOwner(userId);
    }

    // WALLPAPERS
    match /wallpapers/{wallpaperId} {
      allow read: if true;  // Public
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated();  // Add proper admin check in production
    }

    // WALLPAPER STATS
    match /wallpaperStats/{wallpaperId} {
      allow read: if true;
      allow write: if false;  // Only server-side updates via atomic increments
    }

    // FAVORITES
    match /favorites/{favoriteId} {
      allow read: if true;  // For showing user's favorites on public wallpapers
      allow create: if isAuthenticated();
      allow delete: if isAuthenticated();
    }

    // LIKES
    match /likes/{likeId} {
      allow read: if true;
      allow create, delete: if isAuthenticated();
    }

    // DOWNLOADS
    match /downloads/{downloadId} {
      allow read: if isAuthenticated();
      allow create: if true;  // Allow anonymous downloads
    }
  }
}
*/

/* =========================================================
   📱 ENVIRONMENT VARIABLES
========================================================= */

/*
# .env.local

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
*/

export {};
