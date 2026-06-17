<div align="center">

<br>

# 🖼️ Tavryne Wallpapers

### *4K Anime · Gaming · Cyberpunk · Nature · Aesthetic*

[![Live Site](https://img.shields.io/badge/🌐_Live_Site-tavrynewallpapers.vercel.app-00E0A2?style=for-the-badge&logo=vercel&logoColor=white)](https://tavrynewallpapers.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)

<br>

**A production-grade, cyberpunk-styled wallpaper discovery platform.**
Browse, search, like, download and upload wallpapers — backed by
Cloud Firestore, with a full Studio CMS for admins and moderators.
Built with Next.js 16 App Router, React Server Components, and Firebase.

</div>

---

## 📋 Recent Changes

### 2026-06-17 — Data Architecture Consolidation

- **Likes merged into Favorites** — The separate `likes` collection, `toggleLike`, `isLiked`, and like-specific hooks are removed. Liking a wallpaper is now equivalent to favoriting it. The counter field on wallpaper docs is `favorites` (not `likes`).
- **`wallpaperStats` collection eliminated** — All counters (`views`, `impressions`, `clicks`, `downloads`, `favorites`) live directly on `wallpapers/{id}`. No per-event documents are created. Updates use `increment(1)` on the wallpaper doc.
- **User subcollections** — Favorites and downloads are stored as `users/{uid}/favorites/{wallpaperId}` and `users/{uid}/downloads/{wallpaperId}` (not top-level collections with composite IDs).
- **Efficient queries** — `checkMultipleFavorites` uses batched `where("__name__", "in", [...])` instead of N individual `getDoc` calls. `getFavoriteCount`/`getDownloadCount` use `getCountFromServer()` instead of fetching all documents.
- **Orphan cleanup** — `hardDeleteWallpaper` now runs collection-group queries to delete all orphaned favorites/downloads across all users.
- **Shared utils** — `lib/wallpaper-utils.ts` extracted with `normalizeWallpaper`, `coerceDate`, `gcd`, `formatAspectRatio`, `deriveOrientation`. Both client and server store modules import from it.
- **Dead static layer gutted** — `app/lib/wallpapers.ts` no longer defines a separate `Wallpaper` interface; it's a type alias for `WallpaperMetadata`. All populated arrays and non-trivial query functions were removed.
- **Type unification** — `Wallpaper` is now `type Wallpaper = WallpaperMetadata` from `lib/firestore-types.ts`, the single source of truth.

---

## 📑 Table of Contents

- [✨ Features at a Glance](#-features-at-a-glance)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [🔥 Firebase Setup](#-firebase-setup)
- [⚙️ Environment Variables](#️-environment-variables)
- [📜 Available Scripts](#-available-scripts)
- [🗺️ Route Map](#️-route-map)
  - [Public Routes](#public-routes)
  - [Auth Routes](#auth-routes)
  - [User Profile Routes](#user-profile-routes)
  - [Studio CMS Routes](#studio-cms-routes)
  - [Admin Routes](#admin-routes)
  - [API Routes](#api-routes)
  - [SEO Routes](#seo-routes)
- [📁 Project Structure](#-project-structure)
- [🗄️ Firestore Schema](#️-firestore-schema)
- [🔒 Security & Roles](#-security--roles)
  - [Role Hierarchy](#role-hierarchy)
  - [Permission System](#permission-system)
  - [Firestore Security Rules](#firestore-security-rules)
  - [Firestore Indexes](#firestore-indexes)
- [📚 Library Reference](#-library-reference)
  - [Firebase Initialization](#firebase-initialization)
  - [Resolution Tier System](#resolution-tier-system)
  - [Image URL Resolution](#image-url-resolution)
  - [Wallpaper Store (Client)](#wallpaper-store-client)
  - [Wallpaper Store (Server)](#wallpaper-store-server)
  - [Firestore Wallpapers (Legacy)](#firestore-wallpapers-legacy)
  - [Firestore Stats](#firestore-stats)
  - [Firestore Engagement](#firestore-engagement)
  - [Firestore Users](#firestore-users)
  - [Category Store](#category-store)
  - [Tag Store](#tag-store)
  - [Auth Utilities](#auth-utilities)
  - [Role & Permission Helpers](#role--permission-helpers)
  - [Filter System](#filter-system)
  - [Rate Limiting](#rate-limiting)
  - [Request-Scoped Cache](#request-scoped-cache)
  - [Cloudinary Upload](#cloudinary-upload)
  - [App Check](#app-check)
  - [Health Check Server](#health-check-server)
  - [Slug Generator](#slug-generator)
  - [Wallpaper Time Utilities](#wallpaper-time-utilities)
- [🧩 Component Reference](#-component-reference)
  - [Layout Components](#layout-components)
  - [Wallpaper Components](#wallpaper-components)
  - [Filter Components](#filter-components)
  - [Form Components](#form-components)
  - [Admin/Studio Components](#adminstudio-components)
- [🖼️ Studio CMS Deep Dive](#️-studio-cms-deep-dive)
  - [Wallpaper Management](#wallpaper-management)
  - [Bulk Import](#bulk-import)
  - [Category & Tag Management](#category--tag-management)
  - [Health Dashboard](#health-dashboard)
  - [Export](#export)
  - [Recalculate Metadata](#recalculate-metadata)
- [📦 Import Script (CLI)](#-import-script-cli)
- [👤 Role Management Script](#-role-management-script)
- [🔍 Filter System Deep Dive](#-filter-system-deep-dive)
- [🛰️ API Reference](#️-api-reference)
- [🔍 SEO Architecture](#-seo-architecture)
- [☁️ Deployment](#️-deployment)
- [📄 License](#-license)

---

## ✨ Features at a Glance

### 🔐 Authentication & User Management

| Feature | Details |
|:---|---:|
| **Email/Password sign-up** | Strong password validation (10+ chars, uppercase, lowercase, number, special char, no spaces, no repetitive chars, not email-based) |
| **Google OAuth** | One-click sign-in with Google popup |
| **GitHub OAuth** | One-click sign-in with GitHub popup |
| **Email verification** | Required before first sign-in; `sendEmailVerification()` on sign-up |
| **Password reset** | `sendPasswordResetEmail()` with sanitized input |
| **Profile management** | Update display name, avatar (via Cloudinary upload pipeline), synced to Firestore |
| **Session persistence** | Firebase `onAuthStateChanged` listener in `AuthProvider` |
| **Two-tier roles** | Admin (full access) and Moderator (content management only) |

### 🖼️ Wallpaper Discovery

| Feature | Details |
|:---|---:|
| **Home page** | Hero section, search bar, categories strip, featured grid, trending section |
| **All wallpapers** | Full catalog with full filter system |
| **Categories** | Dedicated listing page with wallpaper counts per category |
| **Category filter** | Filter wallpapers by category |
| **Tag filter** | Filter wallpapers by tag (AND logic — must have ALL selected tags) |
| **Orientation filter** | Filter by landscape / portrait / square |
| **Resolution tier filter** | Filter by 8K / 5K / 4K / QHD / HD / SD |
| **Search** | Real-time search across title, category, and tags |
| **Sort options** | Newest, Most Downloaded, Most Viewed, Most Liked, Trending, Featured |
| **Featured collection** | Curated wallpapers selected by moderators |
| **Trending section** | Algorithmically promoted wallpapers |
| **Popular page** | Most-downloaded, most-viewed, and trending wallpapers |
| **Recent edits** | Live activity feed of metadata changes |
| **Related wallpapers** | "People who viewed this also liked…" on detail page |
| **Edit button on detail page** | In-context edit for moderators/admins |

### ⬇️ Engagement & Analytics

| Feature | Details |
|:---|---:|
| **Favorites** | Add/remove favorites; per-user favorites page |
| **Likes** | Toggle like (also auto-favorites); per-user likes page |
| **Downloads** | Track downloads with device type resolution; per-user download history |
| **View tracking** | Record views with session ID, view duration, quality score, device info |
| **Impression tracking** | Record grid impressions with position and source |
| **Click tracking** | Record clicks with source attribution |
| **Real-time stats** | Subscribe to live view/download/like/favorite counts via Firestore `onSnapshot` |
| **Rate limiting** | Client-side `sessionStorage`-based rate limiting (60 likes/min, 20 downloads/min) |

### 🎨 Design & UX

| Feature | Details |
|:---|---:|
| **Cyberpunk dark theme** | CSS variables + Tailwind 4 with neon accents |
| **Framer Motion** | Micro-interactions, page transitions, staggered grid animations |
| **Glass-morphism** | Cards with backdrop blur, glowing borders |
| **Responsive design** | Mobile-first with collapsible nav, filter drawer, slide-in mobile menu |
| **Masonry layout** | `react-masonry-css` for wallpaper grids |
| **Accessibility** | `role="main"`, `aria-label`, `aria-labelledby`, semantic HTML, breadcrumb nav |
| **Image preview** | On-hover zoom effects, lazy loading |

### 📱 Performance & SEO

| Feature | Details |
|:---|---:|
| **Server-rendered routes** | Next.js App Router with React Server Components |
| **Per-route `generateMetadata`** | Dynamic title, description, OG/Twitter card per page |
| **JSON-LD schemas** | Organization, WebSite, BreadcrumbList, CollectionPage, ItemList, ImageObject, FAQPage |
| **Custom sitemap.xml** | Google Image Sitemap extension with `<image:title>` and `<image:caption>`, built from Firestore |
| **Dynamic robots.txt** | Via `robots.ts` |
| **404 for unpublished/deleted** | Enforced at every layer (security rules, server fetch, metadata, JSON-LD, sitemap) |
| **Request-scoped cache** | Deduplicates Firestore reads within the same render (`5s TTL`) |
| **ISR revalidation** | Server actions flush ISR caches after edits |
| **Font optimization** | Inter, Montserrat, Poppins with `display: swap`, `preload: false` |
| **Security headers** | CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy in `next.config.ts` |

### 🛡️ Studio CMS

| Feature | Details |
|:---|---:|
| **Wallpaper listing** | Sortable table (by Updated, Title, Views, Downloads) |
| **Create wallpaper** | Form with title, description, category, tags, image URL (auto-detect dimensions), flags |
| **Edit wallpaper** | Pre-populated edit form with edit history |
| **Bulk import (UI)** | Paste image URLs, auto-detect dimensions, batch process (5 concurrent), duplicate detection |
| **Soft delete** | Restore or permanently delete from trash |
| **Publish/draft workflow** | Toggle published flag; dedicated drafts queue |
| **Featured manager** | Add/remove featured status with search |
| **Edit history** | Field-level diffs, editor identity, timestamps |
| **Categories CRUD** | List, add, edit, delete categories with wallpaper counts |
| **Tags CRUD** | List, add, edit, delete, rename, merge tags with wallpaper counts |
| **Health dashboard** | Counts (published/drafts/deleted/featured/trending), orphaned categories/tags, missing categories/tags, duplicate titles/URLs, category/tag usage rankings |
| **Export** | JSON or CSV export of all wallpapers |
| **Recalculate metadata** | Batch fix `aspectRatio` and `storageProvider` across all wallpapers |
| **Role-gated** | Access controlled via `hasPermission()` — moderator+ can access, admin+ can delete |

### 🔧 Admin Dashboard

| Feature | Details |
|:---|---:|
| **User management** | List all users with email, display name, provider, roles, status |
| **Role management** | Promote/demote moderator roles; manage ban status |
| **Settings management** | Firestore-based site settings (key-value pairs) |
| **Analytics** | View count trends, download trends, top wallpapers |
| **Loading/error states** | `loading.tsx` and `error.tsx` for all admin routes |

### 🛡️ Security

| Feature | Details |
|:---|---:|
| **Firestore security rules** | Granular read/write/delete rules per collection |
| **Two-layered roles** | Auth custom claims (server truth) + Firestore mirror (fast UI checks) |
| **App Check (reCAPTCHA Enterprise)** | Optional — enforces Firestore request origin validation |
| **SSRF protection** | `POST /api/reupload-image` blocks private IPs, localhost, and non-image content types |
| **Rate limiting** | Client-side sessionStorage-based (likes, downloads) |
| **Input sanitization** | URL validation, email sanitization, password strength validation |
| **Locked fields** | `slug`, `id`, `filename`, `createdAt`, `uploaderId` cannot be changed via Firestore rules |
| **`uploadDate` immutability** | Auto-set on creation, never overwritten on edit |
| **Resolution tier auto-tagging** | Resolution tier is auto-added to tags at every write path |

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| **Framework** | Next.js 16 App Router + React 19 Server Components |
| **Language** | TypeScript 5 strict mode |
| **Styling** | CSS Variables + Tailwind 4 (utilities) |
| **Animation** | Framer Motion |
| **Authentication** | Firebase Auth (Email/Password, Google, GitHub) |
| **Database** | Cloud Firestore |
| **Admin SDK** | Firebase Admin SDK (scripts + server reads) |
| **Image Processing** | `sharp` (CLI import script), `browser-image-compression` (client uploads) |
| **Image Hosting** | Cloudinary (avatar uploads, re-upload endpoint) |
| **App Check** | reCAPTCHA Enterprise |
| **Deployment** | Vercel (edge-ready) |
| **State Management** | Zustand (lightweight stores) |
| **Icons** | Lucide React |
| **Masonry Layout** | react-masonry-css |
| **CLI Runner** | `tsx` (TypeScript execution for scripts) |
| **Package Manager** | npm |

---

## 🏗️ Architecture

```
                         ┌────────────────────────────────────┐
                         │          Next.js 16 App            │
                         │  (React Server Components + RSC)   │
                         └──────────────┬─────────────────────┘
                                        │
       ┌────────────────┬───────────────┼─────────────────┬──────────────┐
       │                │               │                 │              │
       ▼                ▼               ▼                 ▼              ▼
 ┌───────────┐    ┌──────────┐   ┌────────────┐    ┌──────────┐   ┌────────────┐
 │  Pages &  │    │  Auth    │   │ Firestore  │    │  Studio  │   │  Admin     │
 │  Layouts  │◄───┤ Context  │──►│ (Web SDK)  │    │  CMS     │   │  SDK       │
 │ (RSC +    │    │ (Client) │   │ Realtime   │    │ (Client) │   │ (scripts)  │
 │  Client)  │    └──────────┘   └─────┬──────┘    └──────────┘   └────────────┘
 └─────┬─────┘                         │
       │                               │
       ▼                               ▼
 ┌──────────┐                    ┌────────────┐
 │  Filter  │                    │  Image     │
 │  System  │                    │  CDN       │
 │ (URL-    │                    │ (Cloudinary│
 │  driven) │                    │  / GitHub) │
 └──────────┘                    └────────────┘
```

**Design principles:**

1. **Firestore-driven** — all wallpaper data, categories, and tags live in Firestore. The static catalog (`app/lib/wallpapers.ts`) was emptied — it only exports the `Wallpaper` type alias and empty arrays for import compatibility.
2. **Two data access layers** — Client components use the Firebase Web SDK (`lib/wallpaper-store.ts`). Server Components use the Firebase Admin SDK (`lib/wallpaper-store-server.ts`) with a 5-second request-scoped cache to avoid N+1 problems.
3. **Resolution tier auto-tagging** — every wallpaper automatically gets its resolution tier ("4K", "HD", "SD", etc.) prepended to its tags array at write time via `withResolutionTag()` in `lib/resolution-tiers.ts`. This happens in `upsertWallpaper()`, `applyWallpaperEdit()`, and the import script.
4. **Filtering is database-driven** — categories and tags come from Firestore data. Resolution tiers (4K/QHD/HD/SD) are computed from actual wallpaper width/height at render time via `getResolutionTier()`. Filters are URL-driven via search params for shareability.
5. **Two-layered roles** — Firebase Auth custom claims (source of truth for security rules) + `users/{uid}.roles` (Firestore mirror for fast UI checks).
6. **Audit trail** — every edit is recorded in `wallpaperEditHistory/{slug}/edits/{id}` with field-level diffs, editor identity, and timestamps.
7. **Bulk import** — `npm run import-public` reads local images via `sharp`, detects dimensions, and writes to Firestore with all auto-detected fields plus resolution tier tag.
8. **`uploadDate` is immutable** — set on creation, never overwritten on edit.
9. **Image URLs go through a resolver** — `resolveImageUrl()` / `resolveThumbnailUrl()` in `lib/wallpaper-image.ts` handle the fallback chain (explicit URL → cross-fallback → `/wallpapers/{filename}`).

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Notes |
|:---|---:|
| Node.js >= 18.18 | 20.x LTS recommended |
| npm >= 9 | or pnpm / yarn / bun |
| Firebase project | Blaze plan, Auth + Firestore enabled |

### 1 · Clone & install

```bash
git clone https://github.com/pjprogrammers/tavrynewallpapers.git
cd tavrynewallpapers
npm install
```

### 2 · Configure environment

```bash
cp .env.example .env.local
# fill in the values (see Environment Variables section)
```

### 3 · (Optional) Bulk import from `public/wallpapers/`

```bash
npm run import-public              # auto-detect dimensions & import all
npm run import-public -- --dry-run # preview first
npm run import-public -- --only=1,3,5  # specific files
npm run import-public -- --exclude=2,4 # exclude files
```

### 4 · Run the dev server

```bash
npm run dev
# ➜  http://localhost:3000
```

### 5 · Sign in & promote to admin

```bash
# Manage user roles (requires service account in .env.local)
npm run role add you@example.com admin
npm run role list
npm run role get you@example.com
```

### 6 · Deploy Firestore rules & indexes

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## 🔥 Firebase Setup

### Firestore database

1. Go to [Firebase Console → Firestore](https://console.firebase.google.com) and create a database.
2. Deploy the security rules and indexes:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Authentication

Enable the following sign-in providers in the Firebase Console:
- Email/Password
- Google
- GitHub

### App Check (reCAPTCHA Enterprise)

1. Go to [Google Cloud Console → reCAPTCHA Enterprise](https://console.cloud.google.com/security/recaptcha) and create a site key.
2. Set `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` in `.env.local`.
3. The app automatically registers the reCAPTCHA provider (when the key is present) and enforces App Check on Firestore calls.

---

## ⚙️ Environment Variables

### Public (browser-exposed) — Firebase Web SDK

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY=
```

### Public — Cloudinary

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=profile_uploads
```

### Server-only — Firebase Admin SDK

Set **one** of the following. `npm run role` and `npm run import-public` require it.

```env
# (a) Inline JSON string (best for Vercel)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# (b) Absolute path to a JSON key file (best for local dev)
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/serviceAccountKey.json

# (c) Google standard env var
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccountKey.json
```

---

## 📜 Available Scripts

| Command | What it does |
|:---|---:|
| `npm run dev` | Start Next.js dev server with HMR |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` type checking |
| `npm run role <verb> <email> [role...]` | Manage user roles (Admin SDK CLI) |
| `npm run import-public` | Bulk-import images from `public/wallpapers/` → Firestore |
| `npm run generate-favicons` | Regenerate PWA icons |
| `firebase deploy --only firestore:rules` | Deploy Firestore security rules |
| `firebase deploy --only firestore:indexes` | Deploy composite indexes |

### `npm run role` cheat sheet

```bash
npm run role add    you@example.com admin
npm run role add    mod@example.com  moderator
npm run role remove you@example.com moderator
npm run role set    you@example.com admin moderator
npm run role clear  you@example.com
npm run role get    you@example.com
npm run role list
npm run role list   admin
```

### `npm run import-public` flags

```bash
npm run import-public                         # full import of all files
npm run import-public -- --dry-run            # preview only (no writes)
npm run import-public -- --only=1,3,5         # only 1.jpg, 3.jpg, 5.jpg
npm run import-public -- --exclude=2,4        # all except 2.jpg, 4.jpg
npm run import-public -- --help               # full help text
```

---

## 🗺️ Route Map

### Public Routes

| Route | Component | Type | Description |
|:------|:----------|:----:|:------------|
| `/` | `app/page.tsx` | Server | Home page — hero section, search bar, categories strip, featured grid, trending wallpapers, all from Firestore |
| `/all` | `app/all/page.tsx` | Server | Full wallpaper catalog with filter system (category, orientation, resolution tier, tags, sort) synced to URL search params |
| `/categories` | `app/categories/page.tsx` | Server | Listing of all categories with wallpaper counts per category |
| `/categories/[categoryId]` | `app/categories/[categoryId]/page.tsx` | Server | Wallpapers filtered by category, with filter system |
| `/tag/[tagId]` | `app/tag/[tagId]/page.tsx` | Server | Wallpapers filtered by tag, with filter system |
| `/search` | `app/search/page.tsx` | Server | Search results driven by `?q=...` query param, with filter system |
| `/featured` | `app/featured/page.tsx` | Server | Featured wallpapers collection, with filter bar |
| `/recent` | `app/recent/page.tsx` | Server | Recently uploaded wallpapers, with filter bar |
| `/popular` | `app/popular/page.tsx` | Server | Most-downloaded, most-viewed, and trending wallpapers (live from Firestore) |
| `/wallpaper/[id]/[slug]` | `app/wallpaper/[id]/[slug]/page.tsx` | Server | Detail page — full image, stats (views/downloads/likes), description, tags, related wallpapers, JSON-LD, edit button for moderators |
| `/edits` | `app/edits/page.tsx` | Server | Live activity feed of recent wallpaper metadata changes (collectionGroup query on edit history) |

### Auth Routes

| Route | Component | Type | Description |
|:------|:----------|:----:|:------------|
| `/login` | `app/login/page.tsx` | Client | Sign-in with email/password, Google OAuth, or GitHub OAuth |
| `/signup` | `app/signup/page.tsx` | Client | Create account with email + password (includes password strength validation) |

### User Profile Routes

| Route | Component | Type | Description |
|:------|:----------|:----:|:------------|
| `/profile` | `app/profile/page.tsx` | Client | Tabbed profile — display name, avatar (Cloudinary upload), email, sign-out |
| `/favorites` | `app/favorites/page.tsx` | Client | User's favorited wallpapers (live subscription) |
| `/downloads` | `app/downloads/page.tsx` | Client | User's download history |
| `/upload` | `app/upload/page.tsx` | Client | Upload a new wallpaper |

### Studio CMS Routes

All Studio routes require moderator or admin role.

| Route | Component | Type | Description |
|:------|:----------|:----:|:------------|
| `/studio` | `app/studio/page.tsx` | Server | Redirects to `/studio/wallpapers` |
| `/studio/wallpapers` | `app/studio/wallpapers/page.tsx` | Client | Wallpaper listing table — search, sort, batch actions (publish/unpublish/feature/delete/restore), per-item edit/view links |
| `/studio/wallpapers/new` | `app/studio/wallpapers/new/page.tsx` | Server + `CreateWallpaperForm` (Client) | Create wallpaper — title, description, category, tags, image URL (auto-detect dimensions), resolution tier badge, flags (published/featured/trending/visible), title + image URL duplicate checks |
| `/studio/wallpapers/edit/[id]` | `app/studio/wallpapers/edit/[id]/page.tsx` | Server + `EditWallpaperPage` (Client) | Edit wallpaper — pre-populated form, auto-detect dimensions, edit history view |
| `/studio/wallpapers/bulk-import` | `app/studio/wallpapers/bulk-import/page.tsx` | Client | Paste image URLs (one per line), auto-detects dimensions, batch processes (5 concurrent), duplicate URL detection |
| `/studio/categories` | `app/studio/categories/page.tsx` | Client | List/add/edit/delete categories with wallpaper counts |
| `/studio/tags` | `app/studio/tags/page.tsx` | Client | List/add/edit/delete/rename/merge tags with wallpaper counts |
| `/studio/drafts` | `app/studio/drafts/page.tsx` | Client | Draft (unpublished) wallpapers queue — publish individually or batch publish all |
| `/studio/deleted` | `app/studio/deleted/page.tsx` | Client | Soft-deleted wallpapers (trash) — restore or permanently delete |
| `/studio/featured` | `app/studio/featured/page.tsx` | Client | Featured manager — currently featured section, search to add more, toggle on/off |
| `/studio/export` | `app/studio/export/page.tsx` | Client | Export all wallpapers as JSON or CSV file download |
| `/studio/health` | `app/studio/health/page.tsx` | Server + `HealthDashboard` (Client) | Health dashboard — counts, missing categories/tags, orphaned categories/tags, duplicates, category/tag usage rankings |
| `/studio/tools/recalculate` | `app/studio/tools/recalculate/page.tsx` | Client | Batch recalculate `aspectRatio` and `storageProvider` for all wallpapers |

### Admin Routes

All Admin routes require admin role.

| Route | Component | Type | Description |
|:------|:----------|:----:|:------------|
| `/admin` | `app/admin/page.tsx` | Client | Admin dashboard overview |
| `/admin/users` | `app/admin/users/page.tsx` | Client | User management — list, promote/demote moderator, ban |
| `/admin/roles` | `app/admin/roles/page.tsx` | Client | Role management interface |
| `/admin/settings` | `app/admin/settings/page.tsx` | Client | Site settings (Firestore key-value) |
| `/admin/analytics` | `app/admin/analytics/page.tsx` | Client | View/download trends, top wallpapers |

### API Routes

| Route | File | Description |
|:------|:-----|:------------|
| `POST /api/reupload-image` | `app/api/reupload-image/route.ts` | Re-host an external image through Cloudinary. Requires moderator+ auth token. SSRF-protected (blocks private IPs, localhost). Validates MIME type (JPEG/PNG/WebP/AVIF only), file size (max 10MB), download timeout (30s). Returns Cloudinary URL. |

### SEO Routes

| Route | File | Type | Description |
|:------|:-----|:----:|:------------|
| `/sitemap.xml` | `app/sitemap.xml/route.ts` | Dynamic | Custom Google Image Sitemap with `<image:title>` and `<image:caption>`. Built from Firestore. Includes home, listing pages, categories (with wallpapers), tags (with wallpapers), and every published/visible wallpaper. 15-minute edge cache. |
| `/robots.ts` | (Next.js convention) | Dynamic | Dynamic robots.txt via Next.js |

---

## 📁 Project Structure

```
tavrynewallpapers/
│
├── app/                                    # Next.js 16 App Router
│   ├── layout.tsx                          # Root layout — fonts (Inter, Montserrat, Poppins),
│   │                                      #   metadata (SEO, OG, Twitter, icons, manifest),
│   │                                      #   JSON-LD (Organization + WebSite schema),
│   │                                      #   AuthProvider + Providers
│   ├── globals.css                         # CSS variables, Tailwind directives
│   ├── styles.css                          # Additional styles
│   ├── providers.tsx                       # Client wrapper — App Check init
│   │
│   ├── (public pages)/
│   │   ├── page.tsx                        # Home page
│   │   ├── all/page.tsx                   # All wallpapers with filter system
│   │   ├── categories/page.tsx            # Categories listing
│   │   ├── categories/[categoryId]/page.tsx # Category-filtered wallpapers
│   │   ├── tag/[tagId]/page.tsx            # Tag-filtered wallpapers
│   │   ├── search/page.tsx                # Search results with filters
│   │   ├── featured/page.tsx              # Featured wallpapers
│   │   ├── recent/page.tsx                # Recently uploaded
│   │   ├── popular/page.tsx               # Most downloaded/viewed/trending
│   │   ├── wallpaper/[id]/[slug]/page.tsx # Wallpaper detail page
│   │   ├── edits/page.tsx                 # Recent edits activity feed
│   │   └── upload/page.tsx                # Upload wallpaper
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx                 # Sign in
│   │   └── signup/page.tsx                # Sign up
│   │
│   ├── profile/page.tsx                   # User profile (tabs: favorites, downloads, settings)
│   ├── favorites/page.tsx                 # User favorites
│   ├── downloads/page.tsx                 # User download history
│   │
│   ├── studio/                            # Studio CMS (moderator+)
│   │   ├── layout.tsx                     # Studio layout — top bar, nav (desktop + mobile drawer),
│   │   │                                 #   role gating, loading/error states
│   │   ├── loading.tsx                    # Studio loading state
│   │   ├── error.tsx                      # Studio error boundary
│   │   ├── page.tsx                       # Redirects to /studio/wallpapers
│   │   ├── wallpapers/page.tsx            # Wallpaper listing table
│   │   ├── wallpapers/new/page.tsx        # Create wallpaper form
│   │   ├── wallpapers/new/CreateWallpaperForm.tsx  # Create form component
│   │   ├── wallpapers/edit/[id]/page.tsx  # Edit wallpaper page
│   │   ├── wallpapers/edit/[id]/EditWallpaperPage.tsx  # Edit page component
│   │   ├── wallpapers/bulk-import/page.tsx # Bulk import UI
│   │   ├── categories/page.tsx            # Categories CRUD manager
│   │   ├── tags/page.tsx                  # Tags CRUD manager (rename, merge)
│   │   ├── drafts/page.tsx                # Draft review queue
│   │   ├── deleted/page.tsx               # Trash (restore/permanent delete)
│   │   ├── featured/page.tsx              # Featured manager
│   │   ├── export/page.tsx                # JSON/CSV export
│   │   ├── health/page.tsx                # Health dashboard
│   │   │   └── HealthDashboard.tsx        # Health dashboard component
│   │   └── tools/recalculate/page.tsx     # Recalculate metadata tool
│   │
│   ├── admin/                             # Admin dashboard (admin only)
│   │   ├── loading.tsx                    # Admin loading state
│   │   ├── error.tsx                      # Admin error boundary
│   │   ├── page.tsx                       # Admin overview
│   │   ├── AdminContent.tsx               # Admin main content component
│   │   ├── users/page.tsx                # User management
│   │   ├── roles/page.tsx                # Role management
│   │   ├── settings/page.tsx             # Site settings
│   │   └── analytics/page.tsx            # Analytics dashboard
│   │
│   ├── api/
│   │   └── reupload-image/route.ts        # Re-host images via Cloudinary
│   ├── sitemap.xml/route.ts               # Custom sitemap.xml
│   ├── actions/revalidate.ts              # Server actions for ISR cache revalidation
│   │
│   └── components/
│       ├── Header.tsx                     # Main site header (553 lines — nav, search, user menu, mobile drawer)
│       ├── Footer.tsx                     # Site footer
│       ├── WallpaperCard.tsx              # Grid card with image, title, stats, hover effects
│       ├── WallpaperGrid.tsx              # Masonry grid layout wrapper
│       ├── WallpaperGridWithStats.tsx     # Grid with live stat subscriptions
│       ├── FeaturedGridWithStats.tsx      # Featured grid with live stat subscriptions
│       ├── SearchBar.tsx                  # Reusable search input
│       ├── CategoryList.tsx              # Category pills/strip
│       ├── CategorySelect.tsx            # Category dropdown selector
│       ├── TagSelector.tsx               # Tag multi-select with typeahead
│       ├── AvatarUpload.tsx              # Avatar upload with crop + compression
│       ├── EditWallpaperFormFields.tsx    # Shared form fields for create/edit
│       ├── EditWallpaperButton.tsx        # In-context edit button on detail page
│       ├── WallpaperEditModal.tsx         # Inline edit modal from detail page
│       └── filters/
│           ├── FilterBar.tsx              # Desktop filter bar (horizontal layout)
│           ├── FilterDrawer.tsx           # Mobile filter drawer (slide-in)
│           ├── FilterPanel.tsx            # All filter controls
│           ├── FilteredListing.tsx        # Single-section page wrapper (header + filter + grid)
│           └── ActiveFilterChips.tsx      # Removable active filter chips
│
├── lib/                                   # Cross-cutting helpers
│   ├── firebase.ts                        # Firebase Web SDK singleton (app, auth, db)
│   ├── firebase-admin.ts                  # Firebase Admin SDK singleton (server-only)
│   ├── firestore-types.ts                 # ALL TypeScript types + collection path constants
│   ├── auth.ts                            # Auth functions (sign in, sign up, Google, GitHub, password reset, profile update)
│   ├── auth-context.tsx                   # React context + provider for auth state
│   ├── roles.ts                           # Permission system (isAdmin, isModerator, hasPermission, Permission type)
│   ├── slug.ts                            # URL slug generator
│   ├── resolution-tiers.ts               # Resolution tier computation + tag management
│   ├── wallpaper-image.ts                # Image URL resolver (imageUrl → resolved URL)
│   ├── wallpaper-store.ts                 # Wallpaper CRUD (client Web SDK) — 1230 lines
│   ├── wallpaper-store-server.ts         # Wallpaper reads (Admin SDK, server-only) — 919 lines
│   ├── firestore-wallpapers.ts           # Legacy wallpaper reads (Web SDK)
│   ├── firestore-stats.ts                # Stats CRUD (views, downloads, clicks, impressions, live subscriptions)
│   ├── firestore-engagement.ts           # Engagement CRUD (favorites, likes, downloads tracking)
│   ├── firestore-users.ts                # User profile CRUD (Web SDK)
│   ├── users.ts                          # Client-safe user list helpers
│   ├── users-server.ts                   # Server-side user list (Admin SDK, server-only)
│   ├── category-store.ts                 # Categories CRUD + merge
│   ├── tag-store.ts                      # Tags CRUD + rename + merge
│   ├── health-check-server.ts            # Health report generator (server-only)
│   ├── use-wallpaper-filters.ts          # Filter state hook + URL sync + client-side filtering
│   ├── use-wallpaper-data.ts            # Wallpaper data hook
│   ├── use-firestore.ts                  # Generic Firestore real-time hooks
│   ├── use-user-roles.ts                 # User role hook
│   ├── cache.ts                          # Request-scoped in-memory cache
│   ├── rate-limit.ts                     # Client-side rate limiting (sessionStorage)
│   ├── cloudinary.ts                     # Cloudinary upload pipeline (validate → compress → crop → upload)
│   ├── app-check.ts                      # App Check initialization (reCAPTCHA Enterprise)
│   ├── app-check.dev.ts                  # App Check debug token for development
│   ├── wallpaper-time.ts                 # Wallpaper time display utilities
│   ├── firestore.ts                      # Barrel re-exports
│   └── index.ts                          # Barrel re-exports
│
├── scripts/                               # Server-only CLI scripts
│   ├── firebase-admin.ts                 # Shared Admin SDK bootstrap for scripts
│   ├── manage-roles.ts                   # Role management CLI (add/remove/set/clear/get/list)
│   ├── import-public.ts                  # Bulk import CLI (reads public/wallpapers/, detects dimensions via sharp)
│   └── generate-favicons.ts             # PWA icon generation
│
├── public/
│   ├── wallpapers/                       # Wallpaper image files (1.jpg … N.jpg)
│   ├── icon-192.svg                      # PWA icon
│   ├── icon-*.png                        # PWA icon raster fallbacks
│   ├── og-image.png                      # Open Graph image
│   └── site.webmanifest                  # PWA manifest
│
├── firestore.rules                       # Firestore security rules (283 lines)
├── firestore.indexes.json                # Composite indexes (13+)
├── next.config.ts                        # Next.js configuration
├── tailwind.config.js                    # Tailwind configuration
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 🗄️ Firestore Schema

### Collection Paths

All collection path constants are defined in `lib/firestore-types.ts`:

| Constant | Value | Purpose |
|:---------|:------|:--------|
| `COLLECTIONS.USERS` | `users` | User profiles |
| `COLLECTIONS.WALLPAPERS` | `wallpapers` | Main wallpaper documents (counters live here) |
| `COLLECTIONS.FAVORITES` | `favorites` | Favorites subcollection under `users/{uid}` |
| `COLLECTIONS.DOWNLOADS` | `downloads` | Downloads subcollection under `users/{uid}` |
| `COLLECTIONS.RATE_LIMITS` | `rateLimits` | Rate limit records |
| `COLLECTIONS.WALLPAPER_EDIT_HISTORY` | `wallpaperEditHistory` | Edit audit trail |
| `COLLECTIONS.CATEGORIES` | `categories` | Category definitions |
| `COLLECTIONS.TAGS` | `tags` | Tag definitions |

### Sub-collections

| Path | Collection ID | Purpose |
|:-----|:------|:--------|
| `users/{uid}/favorites/{wallpaperId}` | `favorites` | Per-user favorite bookmarks |
| `users/{uid}/downloads/{wallpaperId}` | `downloads` | Per-user download history |
| `wallpaperEditHistory/{slug}/edits/{id}` | `edits` | Edit history entries |

### Wallpaper Document (`wallpapers/{id}`)

| Field | Type | Notes |
|:------|:-----|:------|
| `id` | `string` | Numeric ID, matches document ID |
| `slug` | `string` | Same as `id` (document ID) |
| `title` | `string` | Display title |
| `titleLower` | `string` | Lowercased copy for case-insensitive search |
| `description` | `string?` | Optional description |
| `categoryId` | `string` | References `categories/{id}` |
| `tags` | `string[]` | Includes resolution tier tag (auto-prepended) |
| `width` / `height` | `number?` | Image dimensions in pixels |
| `resolution` | `string?` | e.g. `"3840x2160"` |
| `aspectRatio` | `string?` | e.g. `"16:9"` — computed at write time |
| `orientation` | `"landscape" \| "portrait" \| "square"?` | Computed at write time |
| `storageProvider` | `string?` | e.g. `"github"`, `"cloudflare-r2"`, `"cloudinary"` |
| `filename` | `string` | File name in `public/wallpapers/` |
| `imageUrl` | `string?` | External URL (e.g. GitHub raw) |
| `thumbnailUrl` | `string?` | Optional thumbnail URL |
| `visible` | `boolean` | Visibility toggle |
| `published` | `boolean` | Draft/publish workflow |
| `deleted` | `boolean` | Soft-delete flag |
| `featured` / `trending` | `boolean` | Curated flags |
| `uploadDate` | `string` | ISO 8601 UTC — auto-set, not user-configurable |
| `uploaderId` | `string?` | UID of creator |
| `createdBy` / `updatedBy` | `string?` | Editor UIDs |
| `lastEditedBy` | `string?` | Last editor UID |
| `lastEditedAt` | `Timestamp?` | Last edit timestamp |
| `createdAt` / `updatedAt` | `Timestamp` | Firestore timestamps |
| `views` / `impressions` / `clicks` / `downloads` / `favorites` | `number` | Denormalized counters (incremented via `increment(1)`) |

### User Document (`users/{uid}`)

| Field | Type | Notes |
|:------|:-----|:------|
| `uid` | `string` | Firebase Auth UID |
| `displayName` | `string` | Display name |
| `email` | `string` | Email address |
| `photoURL` | `string` | Avatar URL |
| `bio` | `string?` | Optional bio |
| `provider` | `"password" \| "google.com" \| "github.com"` | Auth provider |
| `roles` | `{ admin: bool, moderator: bool }` | Role mirror (set by role script) |
| `createdAt` / `lastLogin` | `Timestamp` | Timestamps |

**Subcollections under `users/{uid}`:**
- `favorites/{wallpaperId}` — stores `{ wallpaperId, wallpaperSlug, wallpaperTitle, wallpaperThumbnail, createdAt }`
- `downloads/{wallpaperId}` — stores `{ wallpaperId, wallpaperSlug, resolution, deviceType, downloadedAt }`

### Edit History Document (`wallpaperEditHistory/{slug}/edits/{id}`)

| Field | Type | Notes |
|:------|:-----|:------|
| `wallpaperSlug` | `string` | Wallpaper slug |
| `editedBy` | `string` | Editor UID |
| `editedByName` | `string` | Editor display name |
| `editedByEmail` | `string` | Editor email |
| `changes` | `Record<string, { from, to }>` | Field-level diffs |
| `after` | `Partial<WallpaperMetadata>` | Full post-edit snapshot |
| `editedAt` | `Timestamp` | Edit timestamp |
| `ipAddress` | `string?` | Optional IP |

### Category Document (`categories/{id}`)

| Field | Type | Notes |
|:------|:-----|:------|
| `name` | `string` | Display name |
| `description` | `string?` | Optional description |
| `createdAt` / `updatedAt` | `Timestamp` | Timestamps |

### Tag Document (`tags/{id}`)

| Field | Type | Notes |
|:------|:-----|:------|
| `name` | `string` | Display name |
| `createdAt` / `updatedAt` | `Timestamp` | Timestamps |

---

## 🔒 Security & Roles

### Role Hierarchy

| Role | Create wallpapers | Edit wallpapers | Delete wallpapers | Manage users | Manage settings |
|:-----|:-----------------:|:---------------:|:-----------------:|:------------:|:---------------:|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Moderator** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **User** | ❌ | ❌ | ❌ | ❌ | ❌ |

Roles are enforced at **three layers**:
1. **Firestore security rules** — server-side enforcement via `request.auth.token.admin` / `request.auth.token.moderator`
2. **Server-side fetch** — unpublished/deleted wallpapers are filtered out for non-moderators
3. **Client-side** — `hasPermission(user, "wallpaper.edit", roles)` gating on all Studio routes

### Permission System

Defined in `lib/roles.ts`:

| Permission | Admins | Moderators |
|:-----------|:------:|:----------:|
| `wallpaper.create` | ✅ | ✅ |
| `wallpaper.edit` | ✅ | ✅ |
| `wallpaper.delete` | ✅ | ❌ |
| `user.manage` | ✅ | ❌ |
| `settings.manage` | ✅ | ❌ |

Key functions:
- `hasPermission(user, permission, mirrorRoles?)` — main permission check
- `isAdmin(user, mirrorRoles?)` — admin check
- `isModerator(user, mirrorRoles?)` — moderator check (admins also pass)
- `canEditWallpapers(user, mirrorRoles?)` — alias for `isModerator`
- `canManageRoles(user, mirrorRoles?)` — alias for `isAdmin`
- `getRolesFromUser(user, mirrorRoles?)` — reads custom claims first, falls back to Firestore mirror
- `toUserRoles(roles[], updatedBy?)` — normalize role array to `UserRoles` object
- `fromUserRoles(roles)` — convert `UserRoles` to role array

### Firestore Security Rules

The rules file (`firestore.rules`, 283 lines) enforces:

**Users collection:**
- Anyone can read user profiles
- Users can update their own profile but cannot change `roles`, `email`, `uid`
- Only admins can write to the `roles` field

**Wallpapers collection:**
- Public read: only wallpapers where `published == true` AND `deleted != true`
- Moderators/admins can read all (including drafts and deleted)
- Only moderators/admins can create (title must be 1-200 chars)
- Only moderators/admins can update (locked fields: `slug`, `id`, `filename`, `createdAt`, `uploaderId`)
- Only admins can delete

**User subcollections (`users/{uid}/favorites`, `users/{uid}/downloads`):**
- Favorites are publicly readable (for UI display)
- Only the owning user can write to their favorites/downloads
- Downloads are open for create (anonymous downloads allowed)
- Collection-group wildcard rules allow admin cleanup of orphans (`hardDeleteWallpaper`)

**Edit history:**
- Anyone can read
- Only moderators/admins can create (append-only, no updates/deletes)

**Categories/Tags collections:**
- Anyone can read
- Only moderators/admins can create/update/delete

### Firestore Indexes

The project uses 13+ composite indexes defined in `firestore.indexes.json` to support queries like:
- `wallpapers` by `featured DESC, updatedAt DESC`
- `wallpapers` by `trending DESC, updatedAt DESC`
- `wallpapers` by `categoryId ASC, updatedAt DESC`
- `wallpapers` by `categoryId ASC, visible ASC, downloads DESC`
- `wallpapers` by `published ASC, updatedAt DESC`
- `wallpapers` by `tags ARRAY_CONTAINS, updatedAt DESC`
- `wallpapers` by `visible ASC, downloads DESC`
- `wallpapers` by `visible ASC, views DESC`
- `wallpapers` by `titleLower ASC, titleLower ASC` (prefix search)
- `users` by `roles.admin ASC`

---

## 📚 Library Reference

### Firebase Initialization

| File | Key Export | Description |
|:-----|:-----------|:------------|
| `lib/firebase.ts` | `getAuth()` | Firebase Auth Web SDK singleton |
| `lib/firebase.ts` | `getDB()` | Firestore Web SDK singleton |
| `lib/firebase.ts` | `app` | Firebase app instance |
| `lib/firebase-admin.ts` | `getAdminDb()` | Admin SDK Firestore (returns `null` if no credentials) |
| `lib/firebase-admin.ts` | `getAdminAuth()` | Admin SDK Auth (returns `null` if no credentials) |

### Resolution Tier System

**File:** `lib/resolution-tiers.ts`

| Export | Type | Description |
|:-------|:-----|:------------|
| `ResolutionTier` | type | `"8K" \| "5K" \| "4K" \| "QHD" \| "HD" \| "SD"` |
| `RESOLUTION_TIERS` | array | All tier strings in order |
| `TIER_TAG_SET` | Set | Set of tier strings for fast lookup |
| `getResolutionTier(w, h)` | function | Returns resolution tier based on longest edge |
| `withResolutionTag(tags, w, h)` | function | Strips stale tier tags, prepends current tier |

Thresholds:

| Tier | Min dimension (longest edge) |
|:-----|:----------------------------|
| 8K | ≥ 7680 px |
| 5K | ≥ 5120 px |
| 4K | ≥ 3840 px |
| QHD | ≥ 2560 px |
| HD | ≥ 1920 px |
| SD | ≥ 1 px |

### Image URL Resolution

**File:** `lib/wallpaper-image.ts`

| Export | Description |
|:-------|:------------|
| `resolveImageUrl(w)` | Full-resolution image URL. Fallback chain: `imageUrl` → `thumbnailUrl` → `/wallpapers/{filename}` |
| `resolveThumbnailUrl(w)` | Thumbnail image URL. Fallback chain: `thumbnailUrl` → `imageUrl` → `/wallpapers/{filename}` |
| `resolveWallpaperImageUrl(w, kind)` | Low-level resolver (used by both above) |
| `toAbsoluteImageUrl(url, siteOrigin)` | Converts relative URLs to absolute (for JSON-LD, sitemap, OG tags) |
| `HasImageFields` | Interface with `imageUrl`, `thumbnailUrl`, `filename` |

### Wallpaper Store (Client)

**File:** `lib/wallpaper-store.ts` (1230 lines)

The client-safe API for wallpaper CRUD, using the Firebase Web SDK. Key exports:

#### Read Functions

| Function | Description |
|:---------|:------------|
| `getWallpaperFromFirestore(slug)` | Get single wallpaper by slug |
| `getAllWallpapersFromFirestore(limit?)` | Get all wallpapers (ordered by updatedAt DESC) |
| `getAllWallpapersForStudio(limit?, sortBy?, sortDir?)` | Get wallpapers for studio listing with sorting |
| `getUnpublishedFromFirestore(limit?)` | Get drafts (unpublished) |
| `getDeletedWallpapersFromFirestore(limit?)` | Get soft-deleted wallpapers |
| `subscribeToWallpaper(slug, callback)` | Real-time subscription to a single wallpaper |

#### Write Functions

| Function | Description |
|:---------|:------------|
| `upsertWallpaper(data)` | Create or overwrite a wallpaper. **Auto-sets** `aspectRatio`, `orientation`, `tags` (via `withResolutionTag`), `uploadDate` (new docs only). **Destructures out** `slug` |
| `applyWallpaperEdit(slug, payload, editor)` | Apply field-level changes. Records edit in `wallpaperEditHistory/{slug}/edits/{id}`. **Auto-syncs** `titleLower` when title changes, **auto-updates** tags when width/height change |
| `restoreWallpaper(slug, editor)` | Restore a soft-deleted wallpaper |
| `deleteWallpaperBySlug(slug, editor?)` | Permanently delete a wallpaper |
| `batchUpdateWallpapers(slugs, fields, editor, actionLabel?)` | Batch publish/unpublish/feature/delete |

#### Validation & Duplicate Detection

| Function | Description |
|:---------|:------------|
| `checkTitleExists(title, excludeId?)` | Check if title is taken (case-insensitive via `titleLower`) |
| `checkImageUrlExists(imageUrl, excludeId?)` | Check if image URL is already used |

#### Helper Functions

| Function | Description |
|:---------|:------------|
| `validateWallpaperEdit(payload)` | Validate edit payload |
| `normalizeWallpaperData(data, nextNum)` | Normalize wallpaper data before save |

### Wallpaper Store (Server)

**File:** `lib/wallpaper-store-server.ts` (919 lines)

Server-side read helpers using the **Firebase Admin SDK**. Cannot be imported from client components (`"server-only"`). All functions use the request-scoped cache (5s TTL).

#### Read Functions

| Function | Description |
|:---------|:------------|
| `getWallpaperByIdServer(id, opts?)` | Get by numeric ID (direct doc lookup then fallback query) |
| `getWallpaperBySlugServer(slug, opts?)` | Get by slug (document ID) |
| `getAllWallpapersServer(pageSize?, includeHidden?)` | All wallpapers (filters `visible`, `published`, `deleted`) |
| `getFeaturedWallpapersServer(pageSize?)` | Featured wallpapers |
| `getTrendingWallpapersServer(pageSize?)` | Trending wallpapers |
| `getWallpapersByCategoryServer(categoryId, pageSize?)` | Wallpapers in a category |
| `getRelatedWallpapersServer(categoryId, excludeSlug, pageSize?)` | Related wallpapers (same category, by downloads). Uses composite index |
| `getPopularWallpapersServer(pageSize?)` | Most-downloaded. Uses composite index |
| `getMostViewedWallpapersServer(pageSize?)` | Most-viewed. Uses composite index |
| `getPublishedWallpapersServer(pageSize?)` | Published wallpapers (recently updated) |
| `getDraftsServer(pageSize?)` | Unpublished wallpapers |
| `getWallpapersByTagServer(tag, pageSize?)` | Wallpapers with a specific tag (array-contains) |
| `searchWallpapersServer(query, options?)` | Search by title prefix, slug, tag, or categoryId |
| `getCategoryByIdServer(id)` | Get category by ID |
| `getTagByIdServer(id)` | Get tag by ID |
| `listCategoriesServer()` | List all categories |
| `listTagsServer()` | List all tags |
| `countWallpaperEditsServer(slug)` | Count edits for a wallpaper |
| `getRecentEditsServer(pageSize?)` | Get recent edits across all wallpapers |

### Firestore Wallpapers (Legacy)

**File:** `lib/firestore-wallpapers.ts`

Legacy Web SDK read functions (replaced by `wallpaper-store.ts` / `wallpaper-store-server.ts` for most use cases):

| Function | Description |
|:---------|:------------|
| `createWallpaper(data)` | Create wallpaper + stats doc in batch |
| `getWallpaperMetadata(wallpaperId)` | Get single wallpaper by ID |
| `getWallpapersByCategory(categoryId, pageSize?, lastDoc?)` | Paginated category query |
| `getAllWallpapers(pageSize?, lastDoc?)` | Paginated all wallpapers |
| `searchWallpapers(searchTerm, pageSize?)` | Search by title prefix |
| `getRecentWallpapers(limit?)` | Recent wallpapers |
| `getWallpapersByIds(ids)` | Get multiple by IDs |
| `getWallpapersWithStats(ids)` | Get stats for multiple wallpapers |
| `batchGetWallpaperStats(ids)` | Batch stats lookup |

### Firestore Stats

**File:** `lib/firestore-stats.ts`

All counters live directly on the `wallpapers/{id}` document — no separate `wallpaperStats` collection. Updates use Firestore's `increment(1)` for eventual consistency without transactions.

| Function | Description |
|:---------|:------------|
| `incrementViews(wallpaperId)` | Increment `views` counter on the wallpaper doc |
| `incrementImpressions(wallpaperId)` | Increment `impressions` counter on the wallpaper doc |
| `incrementClicks(wallpaperId)` | Increment `clicks` counter on the wallpaper doc |
| `hardDeleteWallpaper(wallpaperId)` | Delete wallpaper doc + clean up orphaned favorites/downloads from all users |

### Firestore Engagement

**File:** `lib/firestore-engagement.ts`

Favorites and downloads are stored as subcollections under each user (`users/{uid}/favorites/`, `users/{uid}/downloads/`). The old separate `likes` feature has been merged into `favorites` — there is no separate "like" concept.

| Function | Description |
|:---------|:------------|
| `toggleFavorite(userId, wallpaperId, wallpaperData?)` | Toggle favorite on/off (transactionally updates `favorites` counter) |
| `isFavorited(userId, wallpaperId)` | Check if a wallpaper is favorited |
| `checkMultipleFavorites(userId, ids)` | Batch check using `where("__name__", "in", chunk)` (30 per chunk) |
| `getUserFavorites(userId, pageSize?, lastDoc?)` | Paginated user favorites |
| `getFavoriteCount(userId)` | Count favorites using `getCountFromServer()` |
| `subscribeToUserFavorites(userId, callback)` | Real-time favorites subscription |
| `recordDownload(userId?, data)` | Record download + increment counter; skips subcollection if `userId` is undefined |
| `getUserDownloads(userId, pageSize?)` | Paginated user downloads |
| `getDownloadCount(userId)` | Count downloads using `getCountFromServer()` |
| `hasDownloaded(userId, wallpaperId)` | Check if a wallpaper has been downloaded |
| `subscribeToUserDownloads(userId, callback)` | Real-time downloads subscription |

### Firestore Users

**File:** `lib/firestore-users.ts`

| Function | Description |
|:---------|:------------|
| `createOrUpdateUser(userId, data)` | Create or update user profile (sets `createdAt` on first, always updates `lastLogin`) |
| `getUserProfile(userId)` | Get full user profile |
| `updateUserProfile(userId, data)` | Update display name and/or photo URL |
| `getPublicUserProfile(userId)` | Get public profile (limited fields) |

### Category Store

**File:** `lib/category-store.ts`

| Function | Description |
|:---------|:------------|
| `listCategories()` | List all categories (alphabetical by name) |
| `getCategoryById(id)` | Get single category |
| `addCategory(id, name, description?)` | Create a category |
| `updateCategory(id, fields)` | Update category name and/or description |
| `deleteCategory(id)` | Delete a category |
| `getCategoryWallpaperCount(id)` | Count wallpapers in a category |
| `getAllCategoryCounts()` | Get counts for all categories |
| `mergeCategories(sourceId, targetId)` | Merge one category into another (paginated wallpaper updates, deletes source) |

### Tag Store

**File:** `lib/tag-store.ts`

| Function | Description |
|:---------|:------------|
| `listTags()` | List all tags (alphabetical by name) |
| `getTagById(id)` | Get single tag |
| `addTag(name)` | Create a tag (auto-generates ID from name: lowercase, hyphenated) |
| `updateTag(id, fields)` | Update tag name |
| `deleteTag(id)` | Delete a tag |
| `getTagWallpaperCount(id)` | Count wallpapers with a tag |
| `getAllTagCounts()` | Get counts for all tags |
| `renameTag(oldId, newId, newName?)` | Rename tag (creates new doc, updates all wallpapers, deletes old doc) |
| `mergeTags(sourceId, targetId)` | Merge one tag into another (paginated wallpaper updates, deletes source) |

### Auth Utilities

**File:** `lib/auth.ts`

| Function | Description |
|:---------|:------------|
| `signInWithEmail(email, password)` | Sign in with email/password (checks email verification) |
| `signUpWithEmail(email, password, displayName)` | Sign up (validates password strength, sends verification email, creates user doc) |
| `signInWithGoogle()` | Google OAuth popup |
| `signInWithGitHub()` | GitHub OAuth popup |
| `signOut()` | Sign out |
| `resetPassword(email)` | Send password reset email |
| `updateAuthProfile(user, data)` | Update Firebase Auth + Firestore profile |
| `updateUserPhotoURL(user, photoURL)` | Update photo URL only |
| `updateUserFirestoreProfile(uid, data)` | Update Firestore user document only |

**File:** `lib/auth-context.tsx`

| Export | Description |
|:-------|:------------|
| `AuthProvider` | React context provider wrapping the app with `onAuthStateChanged` listener |
| `useAuth()` | Hook returning `{ user, loading }` |

### Role & Permission Helpers

**File:** `lib/roles.ts`

| Export | Description |
|:-------|:------------|
| `ALL_ROLES` | `["admin", "moderator"]` |
| `isUserRole(role)` | Type guard |
| `toUserRoles(roles[], updatedBy?)` | Normalize to `UserRoles` object |
| `fromUserRoles(roles)` | Convert to array of role strings |
| `getRolesFromUser(user, mirrorRoles?)` | Read custom claims, fall back to Firestore mirror |
| `getRolesFromClaims(claims)` | Read from token result object |
| `isAdmin(user, mirrorRoles?)` | Check if admin |
| `isModerator(user, mirrorRoles?)` | Check if moderator (admins also pass) |
| `hasRole(user, role, mirrorRoles?)` | Check specific role |
| `canEditWallpapers(user, mirrorRoles?)` | Check edit permission |
| `canManageRoles(user, mirrorRoles?)` | Check role management permission |
| `hasPermission(user, permission, mirrorRoles?)` | General permission check |
| `isValidEmail(email)` | Email format validation |
| Permission type | `"wallpaper.create" \| "wallpaper.edit" \| "wallpaper.delete" \| "user.manage" \| "settings.manage"` |
| `AllPermissions` | Permission → description map for UI display |

### Filter System

**File:** `lib/use-wallpaper-filters.ts`

| Export | Description |
|:-------|:------------|
| `useWallpaperFilters()` | Hook managing filter state synced to URL search params. Returns `{ values, setCategory, setOrientation, setResolution, setTags, toggleTag, setSort, setSearch, clearAll, activeCount, hasActiveFilters }` |
| `useFilterableWallpapers(wallpapers, filters)` | Hook to client-side filter an array of wallpapers by all criteria |
| `getAvailableResolutionTiers(wallpapers)` | Compute which resolution tiers exist in a set of wallpapers |
| `SORT_OPTIONS` | Sort option definitions |
| `ORIENTATION_OPTIONS` | Orientation filter options |
| `getResolutionTier` | Re-exported from `resolution-tiers.ts` |

Filter state shape:

```typescript
interface FilterValues {
  category: string;     // "all" or category ID
  orientation: string;  // "all" | "landscape" | "portrait" | "square"
  resolution: string;   // "all" or tier name
  tags: string[];       // AND logic
  sort: string;         // "newest" | "downloads" | "views" | "likes" | "trending" | "featured"
  q: string;            // search query
}
```

All filter values are managed via URL search params: `?category=nature&orient=landscape&res=4K&tags=cyberpunk&sort=downloads&q=ferrari`

### Rate Limiting

**File:** `lib/rate-limit.ts`

| Export | Description |
|:-------|:------------|
| `isRateLimited(action)` | Check if action is rate limited (reads from `sessionStorage`) |
| `recordAction(action)` | Record an action and increment counter |
| `clearRateLimit(action?)` | Clear rate limit for testing |
| `getRateLimitError(action, retryAfter)` | Get user-friendly error message |
| `RATE_LIMITS` | `{ LIKES_PER_MINUTE: 60, DOWNLOADS_PER_MINUTE: 20, WINDOW_MS: 60000 }` |

### Request-Scoped Cache

**File:** `lib/cache.ts`

| Export | Description |
|:-------|:------------|
| `cached(key, factory, ttlMs?)` | Read or compute with caching (5s default TTL) |
| `invalidate(key)` | Invalidate a single cache key |
| `invalidatePrefix(prefix)` | Invalidate all keys starting with prefix |
| `clearCache()` | Reset entire cache (for tests) |

### Cloudinary Upload

**File:** `lib/cloudinary.ts`

| Export | Description |
|:-------|:------------|
| `validateImageFile(file)` | Validate file type and size |
| `compressImage(file, options?)` | Compress image using `browser-image-compression` |
| `createCroppedImage(src, crop, filename, fileType?)` | Create cropped canvas from image |
| `uploadToCloudinary(file, options?)` | Upload to Cloudinary with folder and publicId |
| `uploadAvatar(file, pixelCrop, userId)` | Full pipeline: validate → crop → compress → upload |
| `getImageDimensions(file)` | Get image width/height from File object |
| `deleteFromCloudinary(publicId)` | Placeholder (unsigned uploads can't delete) |
| `UPLOAD_CONFIG` | Configuration constants |

### App Check

**File:** `lib/app-check.ts`

| Export | Description |
|:-------|:------------|
| `appCheck` | App Check instance (ReCaptchaEnterpriseProvider) — `null` if no site key configured |

Automatically initialized on import. Also triggers initialization in dev mode via `lib/app-check.dev.ts`.

### Health Check Server

**File:** `lib/health-check-server.ts`

| Export | Description |
|:-------|:------------|
| `getHealthReport()` | Generates a comprehensive health report: counts (published/drafts/deleted/featured/trending/total), category health (total, orphaned, missing, usage rankings), tag health (same), duplicates (titles, imageUrls), wallpaper list |

### Slug Generator

**File:** `lib/slug.ts`

| Export | Description |
|:-------|:------------|
| `createSlug(title)` | Converts title to URL-friendly slug: lowercase, trim, remove special chars, replace spaces with hyphens |

### Wallpaper Time Utilities

**File:** `lib/wallpaper-time.ts`

Time display helpers for formatting wallpaper dates.

---

## 🧩 Component Reference

### Layout Components

| Component | File | Props | Description |
|:----------|:-----|:------|:------------|
| `Header` | `app/components/Header.tsx` | (none) | Main site header — 553 lines. Logo, navigation links, search toggle, user menu (dropdown), mobile hamburger drawer. Handles auth state, admin link visibility |
| `Footer` | `app/components/Footer.tsx` | (none) | Site footer with links |
| `AuthProvider` | `lib/auth-context.tsx` | `{ children }` | Firebase auth state listener |

### Wallpaper Components

| Component | File | Props | Description |
|:----------|:-----|:------|:------------|
| `WallpaperCard` | `app/components/WallpaperCard.tsx` | `wallpaper, source?` | Grid card with thumbnail, title, category, stats (views/downloads/likes), hover zoom effect |
| `WallpaperGrid` | `app/components/WallpaperGrid.tsx` | `wallpapers[], source?` | Masonry grid layout using `react-masonry-css` |
| `WallpaperGridWithStats` | `app/components/WallpaperGridWithStats.tsx` | `wallpapers[], source?` | Grid with live stat subscription per card |
| `FeaturedGridWithStats` | `app/components/FeaturedGridWithStats.tsx` | `wallpapers[], source?` | Featured grid variant with live stats |
| `SearchBar` | `app/components/SearchBar.tsx` | (none) | Search input that navigates to `/search?q=...` |
| `CategoryList` | `app/components/CategoryList.tsx` | `categories[]` | Horizontal strip of category pills |
| `CategorySelect` | `app/components/CategorySelect.tsx` | (select props) | Category dropdown |
| `TagSelector` | `app/components/TagSelector.tsx` | (multi-select props) | Tag typeahead multi-select |

### Filter Components

| Component | File | Props | Description |
|:----------|:-----|:------|:------------|
| `FilterBar` | `app/components/filters/FilterBar.tsx` | (none) | Desktop filter bar — horizontal layout with all controls visible |
| `FilterDrawer` | `app/components/filters/FilterDrawer.tsx` | (none) | Mobile filter drawer — slide-in from right with backdrop, Apply/Clear buttons |
| `FilterPanel` | `app/components/filters/FilterPanel.tsx` | (none) | All filter controls in a single panel (category, orientation, resolution tier, tags, sort) |
| `FilteredListing` | `app/components/filters/FilteredListing.tsx` | (page config) | Wrapper component combining filter bar/drawer + active chips + wallpaper grid |
| `ActiveFilterChips` | `app/components/filters/ActiveFilterChips.tsx` | (none) | Removable chips showing active filters |

### Form Components

| Component | File | Props | Description |
|:----------|:-----|:------|:------------|
| `EditWallpaperFormFields` | `app/components/EditWallpaperFormFields.tsx` | `form, update, detecting, ...` | Shared form fields for create/edit: title, description, category, tags, image URL (auto-detect), width/height/resolution with resolution tier badge, flags, storage provider |
| `CreateWallpaperForm` | `app/studio/wallpapers/new/CreateWallpaperForm.tsx` | (none) | Full create form (uses `EditWallpaperFormFields` pattern) |
| `EditWallpaperPage` | `app/studio/wallpapers/edit/[id]/EditWallpaperPage.tsx` | `wallpaper` | Edit page component |

### Admin/Studio Components

| Component | File | Props | Description |
|:----------|:-----|:------|:------------|
| `WallpaperEditModal` | `app/components/WallpaperEditModal.tsx` | `wallpaper, onClose, ...` | Inline edit modal from wallpaper detail page |
| `EditWallpaperButton` | `app/components/EditWallpaperButton.tsx` | `wallpaper` | Button to open edit modal from detail page |
| `AvatarUpload` | `app/components/AvatarUpload.tsx` | (avatar upload props) | Avatar upload with crop UI, Cloudinary pipeline |
| `AdminContent` | `app/admin/AdminContent.tsx` | (none) | Admin dashboard main content |
| `HealthDashboard` | `app/studio/health/HealthDashboard.tsx` | `report: HealthReport` | Health dashboard display |

---

## 🖼️ Studio CMS Deep Dive

### Wallpaper Management

#### Create Wallpaper (`/studio/wallpapers/new`)

The `CreateWallpaperForm` component provides:
- **Title** field (max 200 chars) with live slug preview
- **Description** field (max 2000 chars)
- **Category** dropdown (from Firestore `categories` collection)
- **Tags** — typeahead search from Firestore, press Enter or click to add, up to 30 tags
- **Image URL** — paste URL, auto-detects dimensions on blur (uses browser `Image` API)
- **Resolution / Width / Height** — manual entry or auto-detected
- **Resolution tier badge** — shows computed tier (4K/QHD/HD/SD) next to aspect ratio
- **Storage provider** — auto-detect or manual override
- **Flags** — Published, Featured, Trending, Visible toggles
- **Uniqueness checks** — title (`checkTitleExists`) and image URL (`checkImageUrlExists`) validated before save
- **Auto-ID** — next numeric ID from Firestore max
- On success: shows created URL with "Create another" / "View wallpaper" options

#### Edit Wallpaper (`/studio/wallpapers/edit/[id]`)

The `EditWallpaperPage` + `EditWallpaperFormFields` provide:
- Pre-populated form from Firestore
- Auto-detect dimensions on image URL blur
- Resolution tier badge display
- All the same fields as create
- Edit history view (via `?history=1` query param)
- After save: calls `revalidateWallpaperPaths()` to flush ISR caches

#### Edit History

Every edit is recorded in `wallpaperEditHistory/{slug}/edits/{id}` with:
- Field-level diffs (old value → new value)
- Editor identity (UID, display name, email)
- Timestamp
- Full post-edit snapshot

#### Delete & Restore

- **Soft delete** — sets `deleted: true` (wallpaper hidden from all public pages)
- **Restore** — sets `deleted: false` from the trash page
- **Permanent delete** — removes `wallpapers/{id}` doc + all orphaned `favorites`/`downloads` subcollection entries across all users

### Bulk Import

#### Studio UI (`/studio/wallpapers/bulk-import`)

- Paste one image URL per line
- Each URL is checked for duplicates (`checkImageUrlExists`)
- Dimensions auto-detected via browser `Image` API
- Processes in batches of 5 (concurrent)
- Creates unpublished drafts with auto-detected data
- Shows result summary (created / duplicates / failed)

#### CLI Script (`npm run import-public`)

Separate from the UI — reads files from `public/wallpapers/` directory.

See [Import Script (CLI)](#-import-script-cli) section.

### Category & Tag Management

#### Categories (`/studio/categories`)

- Table view with ID, Name, Description, Wallpaper count
- **Add** — specify ID (URL slug), name, optional description
- **Edit** — update name and description
- **Delete** — removes category (wallpapers keep their `categoryId`)
- Search/filter by name or ID

#### Tags (`/studio/tags`)

- Table view with ID, Name, Wallpaper count
- **Add** — enter name, ID auto-generated
- **Edit** — update display name
- **Rename** — change ID (creates new tag doc, updates all wallpapers, deletes old doc)
- **Merge** — move all wallpapers from one tag to another, delete source
- **Delete** — removes tag definition (does NOT remove from wallpapers)
- Search/filter by name or ID

### Health Dashboard

**Route:** `/studio/health`
**Server component:** fetches `HealthReport` via `getHealthReport()`
**Client component:** `HealthDashboard` displays:

- **Counts** — published, drafts, deleted, featured, trending, total
- **Category Health** — total categories, orphaned (0 wallpapers), missing (wallpapers referencing non-existent categories), usage rankings (top 10)
- **Tag Health** — same structure as categories
- **Duplicates** — duplicate titles, duplicate image URLs (with links to edit)
- **Wallpaper list** — all wallpapers with image previews

### Export

**Route:** `/studio/export`

- Loads all wallpapers from Firestore (up to 1000)
- **JSON export** — full data with nested fields
- **CSV export** — spreadsheet format with all fields
- Download as `wallpapers-{date}.json` / `wallpapers-{date}.csv`

### Recalculate Metadata

**Route:** `/studio/tools/recalculate`

Scans all wallpapers and recalculates:
- `aspectRatio` from width/height (using GCD)
- `storageProvider` from image URL hostname detection

---

## 📦 Import Script (CLI)

**File:** `scripts/import-public.ts`
**Run with:** `npm run import-public`

Reads image files from `public/wallpapers/`, detects dimensions via `sharp`, and bulk-imports them as new wallpapers into Firestore.

### What it does per wallpaper

- Generates sequential numeric ID (max existing + 1)
- Detects width/height via `sharp`
- Computes aspect ratio (GCD) and orientation
- Auto-tags resolution tier via `withResolutionTag()`
- Sets defaults: `categoryId: "abstract"`, `published: true`, `visible: true`, `deleted: false`
- Sets `favorites: 0` as initial counter on wallpaper doc
- **Filename-based dedup** — skips files whose `filename` already exists in Firestore

### Flags

| Flag | Description |
|:-----|:------------|
| `--dry-run` | Preview only — no Firestore writes |
| `--only=<ids>` | Comma-separated file names/numbers (e.g. `1,3,5`) |
| `--exclude=<ids>` | Comma-separated file names/numbers to skip |
| `--help` | Full usage text |

### Supported image formats

`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`

### Credentials

Requires Firebase Admin SDK credentials (see Environment Variables section).

---

## 👤 Role Management Script

**File:** `scripts/manage-roles.ts`
**Run with:** `npm run role <verb> <email> [role...]`

Manages user roles via the Firebase Admin SDK. Updates both Auth custom claims AND Firestore `users/{uid}.roles` mirror.

### Verbs

| Verb | Description |
|:-----|:------------|
| `add <email> <role...>` | Add role(s) to user |
| `remove <email> <role...>` | Remove role(s) from user |
| `set <email> <role...>` | Set exact role list (replaces all existing) |
| `clear <email>` | Remove all roles from user |
| `get <email>` | Show user's current roles |
| `list [role]` | List all users (optionally filter by role) |

**Available roles:** `admin`, `moderator`

---

## 🔍 Filter System Deep Dive

All listing pages (`/all`, `/categories/[id]`, `/search`, `/tag/[id]`, `/featured`, `/recent`) use a shared filter system.

### Architecture

1. **`useWallpaperFilters()` hook** — manages filter state synced to URL search params
2. **`useFilterableWallpapers()` hook** — takes a wallpaper array + filters, applies all criteria in-memory
3. **`FilterPanel` component** — renders all filter controls
4. **`FilterBar` / `FilterDrawer`** — desktop vs mobile layout

### URL Search Params

All filters are encoded in the URL for shareability:
```
?category=nature&orient=landscape&res=4K&tags=cyberpunk&sort=downloads&q=ferrari
```

| Param | Values |
|:------|:-------|
| `category` | Category ID or `all` |
| `orient` | `all`, `landscape`, `portrait`, `square` |
| `res` | `all`, `8K`, `5K`, `4K`, `QHD`, `HD`, `SD` |
| `tags` | Comma-separated tag IDs (AND logic) |
| `sort` | `newest`, `downloads`, `views`, `likes`, `trending`, `featured` |
| `q` | Search query string |

### Filtering Logic

- **Category** — exact match on `categoryId`
- **Orientation** — exact match on `orientation` field
- **Resolution tier** — computed at render time via `getResolutionTier(width, height)`, filtered client-side
- **Tags** — AND logic: wallpaper must have ALL selected tags
- **Search** — case-insensitive match on title, categoryId, and tags
- **Sort** — `newest` (uploadDate), `downloads`, `views`, `likes` (descending), `trending` (filter + sort by views), `featured` (filter only)

### Filter Controls

| Control | Type | Source |
|:--------|:-----|:------|
| Search | Text input | Client-side on title/category/tags |
| Category | Dropdown | Firestore `categories` collection |
| Orientation | Chip group | Fixed: landscape / portrait / square |
| Resolution | Pill row | Computed from wallpaper dimensions via `getAvailableResolutionTiers()` |
| Tags | Chip group | Firestore `tags` collection |
| Sort | Dropdown | Fixed options |

---

## 🛰️ API Reference

### `POST /api/reupload-image`

Re-hosts an external image through Cloudinary. Intended for moderator use.

**Authentication:** Bearer token with moderator+ role

**Request:**
```json
{ "imageUrl": "https://example.com/image.jpg" }
```

**Response (success):**
```json
{ "success": true, "imageUrl": "https://res.cloudinary.com/.../image.jpg" }
```

**Response (error):**
```json
{ "success": false, "error": "..." }
```

**Security measures:**
- Requires valid Firebase ID token with moderator or admin claim
- SSRF protection — blocks private IPs (10.x, 172.16-31.x, 192.168.x, 169.254.x, localhost, IPv6 private/link-local)
- Only HTTP/HTTPS protocols allowed
- MIME type validation — only JPEG, PNG, WebP, AVIF
- File size limit: 10MB
- Download timeout: 30 seconds

### Server Actions

**File:** `app/actions/revalidate.ts`

| Export | Description |
|:-------|:------------|
| `revalidateWallpaperPaths(slug, affects?)` | Revalidate ISR caches for wallpaper detail, sitemap, home, /all, /recent, /featured, and optionally category/tag/featured pages |

Called from the edit modal after a successful save to flush ISR caches.

---

## 🔍 SEO Architecture

### Metadata

- **Root layout** — global metadata: title template, description, keywords (40+), OG/Twitter card, icons (SVG + PNG fallbacks + Apple touch), manifest, Windows tile
- **Per-page metadata** — every route exports `generateMetadata()` with route-specific title, description, OG card, canonical URL
- **Verification** — Google Search Console verification meta tag
- **Robots** — admin/auth/studio pages are `noindex, nofollow`

### JSON-LD Structured Data

| Schema | Where injected | Description |
|:-------|:---------------|:------------|
| `Organization` | Root layout | Brand info, logo, description, sameAs (social links), contact point, disambiguatingDescription ("not related to taurine") |
| `WebSite` | Root layout | Site name, URL, Sitelinks Search Box (`/search?q={search_term_string}`) |
| `BreadcrumbList` | Per-page | Navigation breadcrumbs |
| `CollectionPage` | Listing pages (all, featured, popular, etc.) | Collection with item count |
| `ItemList` | Popular page | Top 20 most-downloaded with position, name, URL, image |
| `ImageObject` | Wallpaper detail page | Full image metadata with caption |
| `FAQPage` | (generator available) | FAQ structured data |
| `WebPage` | Edits page | Activity feed page schema |

### Sitemap

**Route:** `/sitemap.xml`
**File:** `app/sitemap.xml/route.ts`

Custom Google Image Sitemap implementation with:
- `<image:image>` extension with `<image:title>` and `<image:caption>`
- Built from Firestore (not static data)
- Includes: homepage, listing pages (/all, /featured, /recent, /popular, /edits, /categories/all), category pages (with wallpapers), tag pages (with wallpapers), and every published/visible wallpaper
- Excludes hidden, unpublished, and deleted wallpapers
- 15-minute edge cache (`s-maxage=900`)
- Force-dynamic (regenerated on each request at the edge)

### 404 for Unpublished/Deleted

Unpublished and soft-deleted wallpapers return 404 at every layer:
1. **Firestore security rules** — block reads for non-moderators
2. **Server-side fetch** — `getWallpaperBySlugServer` filters `published` and `deleted`
3. **`generateMetadata()`** — returns `noindex` for unpublished
4. **JSON-LD** — omitted for non-published
5. **Sitemap** — excludes all non-published

---

## ☁️ Deployment

The project is designed for **Vercel**.

```bash
npm run build    # compiles successfully
vercel --prod    # or push to a Vercel-connected git branch
```

### Environment variables

Set all public (`NEXT_PUBLIC_*`) and server-only variables in the Vercel dashboard.

### Firebase App Check

Ensure your App Check key (`NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY`) is set in the production environment.

### Build checks

```bash
npm run lint        # ESLint — 0 errors required
npm run typecheck   # tsc --noEmit — 0 errors required
```

---

## 📄 License

MIT — see [LICENSE](LICENSE).