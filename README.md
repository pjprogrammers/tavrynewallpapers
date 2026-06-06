<div align="center">

<!-- ============== HERO ============== -->

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

**A modern, cyberpunk-styled wallpaper discovery platform.**
Browse, search, like, download and upload 4K · HD · 8K wallpapers — backed by
Firebase, animated with Three.js + Framer Motion, and built end-to-end on Next.js 16.

<br>

<img src="https://img.shields.io/badge/40+-wallpapers-00E0A2?style=flat-square" />
<img src="https://img.shields.io/badge/10-categories-4260EC?style=flat-square" />
<img src="https://img.shields.io/badge/15+-tags-FA5252?style=flat-square" />
<img src="https://img.shields.io/badge/3D-particles-FF3366?style=flat-square" />
<img src="https://img.shields.io/badge/PWA-ready-8B5CF6?style=flat-square" />
<img src="https://img.shields.io/badge/SEO-optimized-10B981?style=flat-square" />

</div>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🖼️ Screenshots](#️-screenshots)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [🔥 Firebase Setup (Step-by-Step)](#-firebase-setup-step-by-step)
- [☁️ Cloudinary Setup](#-cloudinary-setup)
- [🛡️ Firebase App Check (reCAPTCHA)](#️-firebase-app-check-recaptcha)
- [⚙️ Environment Variables](#️-environment-variables)
- [📜 Available Scripts](#-available-scripts)
- [📁 Project Structure](#-project-structure)
- [🎨 Design System](#-design-system)
- [🗄️ Database Schema (Firestore)](#️-database-schema-firestore)
- [🔒 Security Rules Walkthrough](#-security-rules-walkthrough)
- [🗺️ Page-by-Page Tour](#️-page-by-page-tour)
- [🛰️ API Reference](#️-api-reference)
- [🔐 Authentication & Roles](#-authentication--roles)
- [➕ Adding New Wallpapers](#-adding-new-wallpapers-3-methods)
- [🛠️ Admin & Moderator Workflow](#️-admin--moderator-workflow)
- [🔍 SEO Playbook](#-seo-playbook)
- [🎨 Customization Guide](#-customization-guide)
- [☁️ Deployment](#-deployment)
- [🧪 Lint & Type-check](#-lint--type-check)
- [🧯 Troubleshooting](#-troubleshooting)
- [❓ FAQ](#-faq)
- [🌍 Browser Support](#-browser-support)
- [🧑‍💻 Code Style](#-code-style)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)
- [📧 Contact](#-contact)

---

## ✨ Features

<table>
  <tr>
    <td width="50%" valign="top">

### 🔐 Authentication
- Email + password (with strong password rules)
- Google OAuth & GitHub OAuth
- Email verification before first sign-in
- Password reset flow
- Avatar upload (Cloudinary, presets, or URL)

### 🖼️ Wallpaper Discovery
- 40+ curated wallpapers across **10 categories**
- 15+ searchable **tags** (4K, 5K, 8K, dark, gradient, etc.)
- Real-time search with `/search` results page
- Filter by category (`/categories/[id]`) and tag (`/tag/[id]`)
- Featured, trending and recent collections

### ⬇️ Engagement
- One-click download (resolution-aware)
- Favorites & downloads history (per-user)
- Real-time **view / like / download** counters
- Live "Trending this week" feed

</td>
    <td width="50%" valign="top">

### 👤 User Experience
- Modern profile page with **3D animated background** (Three.js)
- Tabbed profile: Overview · Favorites · Downloads · Settings
- Inline editing of display name, bio & avatar
- GitHub-style avatar modal (upload / preset / URL)
- Achievement cards, stat circles, animated progress line

### 🎨 Design & Motion
- Cyberpunk dark theme with **neon accents** (`#00E0A2`, `#4260EC`, `#FA5252`)
- Framer Motion micro-interactions everywhere
- Custom CSS variables (no Tailwind utility soup in components)
- Smooth scroll, scroll-aware sticky header
- Glass-morphism cards, glowing borders, animated gradients

### 📱 Performance & SEO
- Server-rendered routes (Next.js App Router)
- AVIF + WebP image optimization
- Dynamic per-route `generateMetadata` + JSON-LD schemas
- Auto-generated `sitemap.xml` and `robots.ts`
- Lighthouse-friendly PWA via `site.webmanifest`

</td>
  </tr>
</table>

---

## 🖼️ Screenshots

<div align="center">

| 🏠 Home | 🖼️ Wallpaper Detail |
|:---:|:---:|
| Hero with 3D particles, search, trending categories | Full-resolution preview, download, like, edit |

| 👤 Profile | 🛡️ Admin Dashboard |
|:---:|:---:|
| Three.js animated background, tabs, achievements | Role management, recent edits, moderation |

| 🔍 Search | ⬆️ Upload |
|:---:|:---:|
| Real-time query + tag filtering | Drag-and-drop, image cropping, category & tag picker |

</div>

> Live preview → **[tavrynewallpapers.vercel.app](https://tavrynewallpapers.vercel.app)**

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|:---|:---|
| **Framework** | ![Next.js](https://img.shields.io/badge/Next.js_16-000?style=flat-square&logo=next.js&logoColor=white) App Router · React Server Components |
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white) strict mode |
| **Styling** | ![CSS](https://img.shields.io/badge/CSS_Variables-1572B6?style=flat-square&logo=css3&logoColor=white) + ![Tailwind](https://img.shields.io/badge/Tailwind_4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) (utilities) |
| **Animation** | ![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-FF0055?style=flat-square) · ![Three.js](https://img.shields.io/badge/Three.js-+R3F_9-000?style=flat-square&logo=three.js) |
| **Auth & DB** | ![Firebase Auth](https://img.shields.io/badge/Firebase_Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black) · ![Firestore](https://img.shields.io/badge/Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black) |
| **Storage** | ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white) (avatars, re-hosted URLs) |
| **Icons** | ![Lucide](https://img.shields.io/badge/Lucide-React-F56565?style=flat-square) + `react-icons` |
| **State** | ![Zustand](https://img.shields.io/badge/Zustand-5-orange?style=flat-square) for client stores |
| **Server scripts** | ![Firebase Admin](https://img.shields.io/badge/Firebase_Admin-13-FFCA28?style=flat-square&logo=firebase&logoColor=black) (roles, seeding) |
| **Deployment** | ![Vercel](https://img.shields.io/badge/Vercel-000?style=flat-square&logo=vercel&logoColor=white) · edge-ready |

</div>

### Key libraries

- **[@react-three/fiber](https://docs.pmnd.rs/react-three-fiber)** + **[three](https://threejs.org)** — Three.js particle field on the profile page
- **[framer-motion](https://www.framer.com/motion/)** — declarative animations across cards, tabs, modals
- **[react-easy-crop](https://github.com/ValentinH/react-easy-crop)** + **[browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)** — image upload pipeline
- **[react-masonry-css](https://github.com/paulcollett/react-masonry-css)** — masonry layout for galleries
- **[react-parallax-tilt](https://github.com/mkosir/react-parallax-tilt)** — 3D card hover effects
- **[axios](https://axios-http.com)** — typed HTTP client
- **[unsplash-js](https://github.com/unsplash/unsplash-js)** — optional source for the seed script
- **[zustand](https://github.com/pmndrs/zustand)** — lightweight global stores (wallpaper store, etc.)
- **[server-only](https://nextjs.org)** — guards the Admin SDK from being bundled to the client

---

## 🏗️ Architecture

```
                         ┌────────────────────────────────────┐
                         │           Next.js 16 App           │
                         │   (React Server Components + RSC)  │
                         └──────────────┬─────────────────────┘
                                        │
       ┌────────────────┬───────────────┼─────────────────┬───────────────┐
       │                │               │                 │               │
       ▼                ▼               ▼                 ▼               ▼
 ┌───────────┐    ┌──────────┐   ┌────────────┐    ┌──────────┐    ┌────────────┐
 │  Pages &  │    │  Auth    │   │ Firestore  │    │  Static  │    │  Edge /    │
 │  Layouts  │◄───┤ Context  │──►│ (Web SDK)  │    │   data   │    │  Proxy     │
 │ (RSC +   │    │ (Client) │   │ Realtime   │    │wallpapers│    │(security + │
 │  Client)  │    └──────────┘   └─────┬──────┘    │   .ts    │    │ redirects) │
 └─────┬─────┘                         │           └──────────┘    └────────────┘
       │                               │
       │            ┌──────────────────┴──────────────────┐
       │            │                                     │
       ▼            ▼                                     ▼
 ┌──────────┐  ┌────────────┐                       ┌──────────────┐
 │  Admin / │  │ Cloudinary │  ── avatars ──►       │ Firebase     │
 │ Moderator│  │  (images)  │                       │ Admin SDK    │
 │  routes  │  └────────────┘                       │ (scripts)    │
 └──────────┘                                       └──────────────┘
```

**Design principles**

1. **Static-first** — base wallpaper catalog is just a TypeScript array (`app/lib/wallpapers.ts`).
2. **Firestore when it matters** — per-user data (favorites, downloads), real-time stats, edit history, role claims.
3. **Server-only guardrails** — `lib/admin.ts` and `scripts/*` import `"server-only"` so Admin credentials can never leak to the client.
4. **Two-layered roles** — Firebase Auth custom claims (security rules) + `users/{uid}.roles` mirror (fast UI).
5. **Idempotent seed** — `npm run seed-wallpapers` is safe to re-run and never deletes data.

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Notes |
|:---|:---:|:---|
| **Node.js** | `>= 18.18` | 20.x LTS recommended |
| **npm** | `>= 9` | or `pnpm` / `yarn` / `bun` |
| **Git** | latest | for cloning |
| **Firebase project** | Blaze plan | Auth + Firestore enabled |

### 1 · Clone & install

```bash
git clone https://github.com/pjprogrammers/tavrynewallpapers.git
cd tavrynewallpapers

npm install
```

### 2 · Configure environment

```bash
cp .env.example .env.local
# then open .env.local and fill in the values (see next section)
```

### 3 · (Optional) Seed the catalog

```bash
npm run seed-wallpapers            # uploads static catalog → Firestore
npm run seed-wallpapers -- --dry-run   # preview first
```

### 4 · Run the dev server

```bash
npm run dev
# ➜  http://localhost:3000
```

### 5 · Sign in & try the admin flow

```bash
# Promote any user to admin (requires service account in .env.local)
npm run role add you@example.com admin
```

---

## ⚙️ Environment Variables

Create a `.env.local` (gitignored) — see [`.env.example`](.env.example) for the full template.

### 🌐 Public (browser-exposed) — Firebase Web SDK

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

> Cloudinary vars are no longer required at the client since the
> `/api/reupload-image` route handles re-hosting. If you still want
> direct uploads from the profile page, add:
>
> ```env
> NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
> NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
> ```

### 🔐 Server-only — Firebase Admin SDK

Set **one** of the following. `npm run role` and `npm run seed-wallpapers` will fail without it.

```env
# (a) Inline JSON (best for Vercel)
FIREBASE_SERVICE_ACCOUNT_KEY=

# (b) Absolute path to a JSON key file (best for local dev)
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/serviceAccountKey.json

# (c) Google standard
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccountKey.json
```

> ⚠️ **Never** commit `serviceAccountKey.json` or the `FIREBASE_SERVICE_ACCOUNT_KEY` value.
> `.gitignore` already excludes the file — the env var is your responsibility.

---

## 📜 Available Scripts

| Command | What it does |
|:---|:---|
| `npm run dev` | Start the Next.js dev server with HMR |
| `npm run build` | Production build (RSC + client bundles) |
| `npm run start` | Serve the production build |
| `npm run lint` | Run `next lint` (ESLint flat config) |
| `npm run typecheck` | `tsc --noEmit` (strict type-check) |
| `npm run role <verb> <email> [role...]` | Manage user roles (see `scripts/manage-roles.ts`) |
| `npm run seed-wallpapers` | Upload `app/lib/wallpapers.ts` → Firestore |
| `npm run generate-favicons` | Regenerate PWA icons from `app/favicon.ico` |

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

### `npm run seed-wallpapers` flags

```bash
npm run seed-wallpapers                       # full seed
npm run seed-wallpapers -- --dry-run          # preview only
npm run seed-wallpapers -- --only=some-slug   # one wallpaper
npm run seed-wallpapers -- --ids=1,2,3        # numeric IDs from wallpapers.ts
npm run seed-wallpapers -- --force            # overwrite existing edits
```

---

## 📁 Project Structure

```
tavrynewallpapers/
├── app/                                    # Next.js 16 App Router
│   ├── (root)/
│   │   ├── page.tsx                        # Home (hero + featured + categories)
│   │   ├── all/                            # Full catalog grid
│   │   ├── categories/[categoryId]/        # Filtered by category
│   │   ├── tag/[tagId]/                    # Filtered by tag
│   │   ├── search/                         # Search results
│   │   ├── featured/                       # Featured collection
│   │   ├── recent/                         # Recently uploaded
│   │   └── wallpaper/[slug]/               # Detail page (image + actions)
│   ├── (auth)/
│   │   ├── login/                          # Sign in
│   │   └── signup/                         # Sign up
│   ├── profile/                            # Authenticated profile
│   │   ├── page.tsx
│   │   ├── profile.css
│   │   ├── ParticleField.tsx               # Three.js particle field
│   │   └── AnimatedBackgroundLazy.tsx       # Dynamic import wrapper
│   ├── favorites/                          # User favorites
│   ├── downloads/                          # User downloads history
│   ├── upload/                             # Submit a new wallpaper
│   ├── edits/                              # Recent moderation log
│   ├── admin/                              # Admin dashboard (role-gated)
│   ├── api/
│   │   └── reupload-image/route.ts         # Re-hosts external URLs via Cloudinary
│   ├── sitemap.xml/route.ts                # Dynamic sitemap
│   ├── robots.ts                           # robots.txt generator
│   ├── actions/revalidate.ts               # Server actions (revalidatePath, …)
│   ├── components/                         # Shared client components
│   │   ├── Header.tsx                      # Sticky nav w/ scroll effect
│   │   ├── Footer.tsx
│   │   ├── SearchBar.tsx
│   │   ├── CategoryList.tsx
│   │   ├── WallpaperCard.tsx
│   │   ├── WallpaperGrid.tsx
│   │   ├── WallpaperGridWithStats.tsx
│   │   ├── FeaturedGridWithStats.tsx
│   │   ├── AvatarUpload.tsx
│   │   ├── EditWallpaperButton.tsx
│   │   └── WallpaperEditModal.tsx
│   ├── lib/
│   │   └── wallpapers.ts                   # Static catalog (categories, tags, 40 items)
│   ├── styles.css                          # Global design system
│   ├── globals.css                         # Tailwind layers
│   ├── layout.tsx                          # Root layout, fonts, JSON-LD
│   ├── providers.tsx                       # Client providers
│   ├── error.tsx · loading.tsx · not-found.tsx
│   └── favicon.ico
│
├── lib/                                    # Cross-cutting helpers
│   ├── firebase.ts                         # Web SDK singleton (lazy)
│   ├── admin.ts                            # Admin SDK singleton (server-only)
│   ├── auth.ts                             # Sign in/up/out, password rules
│   ├── auth-context.tsx                    # React context + `useAuth`
│   ├── firestore.ts                        # User CRUD helpers
│   ├── firestore-types.ts                  # Shared TS types
│   ├── firestore-integration.ts            # Wallpaper ↔ Firestore mapping
│   ├── wallpaper-store.ts                  # Wallpaper doc reads/writes
│   ├── wallpaper-time.ts                   # "x minutes ago" formatters
│   ├── use-firestore.ts                    # React hooks for live data
│   ├── use-user-roles.ts                   # Role hook
│   ├── use-wallpaper-data.ts
│   ├── users.ts
│   ├── roles.ts                            # `isAdmin`, `isModerator`
│   ├── rate-limit.ts
│   ├── app-check.ts
│   ├── cloudinary.ts
│   └── index.ts                            # Barrel export
│
├── scripts/                                # Server-only CLIs
│   ├── firebase-admin.ts                   # Shared Admin SDK bootstrap
│   ├── manage-roles.ts                     # `npm run role`
│   ├── seed-wallpapers.ts                  # `npm run seed-wallpapers`
│   └── generate-favicons.ts                # `npm run generate-favicons`
│
├── public/
│   ├── wallpapers/                         # 40 wallpaper JPGs (1.jpg … 40.jpg)
│   ├── avatars_preset/                     # Default avatar art
│   ├── icon-16/32/48/64/96/128/180/192/256/384/512.png
│   ├── icon-192.svg                        # Primary SVG favicon
│   ├── og-image.png                        # 1200×630 social card
│   ├── favicon.ico
│   └── site.webmanifest                    # PWA manifest
│
├── firestore.rules                         # Security rules
├── firestore.indexes.json                  # Composite indexes
├── proxy.ts                                # Edge proxy (CSP, redirects, gating)
├── next.config.ts                          # Image domains, headers, redirects
├── tailwind.config.js                      # Tailwind 4 plugin config
├── postcss.config.mjs
├── eslint.config.mjs
├── tsconfig.json
├── .env.example
├── guide.md                                # How to add wallpapers
├── LICENSE
└── README.md                               # ← you are here
```

---

## 🎨 Design System

### Color tokens (`app/styles.css`)

| Token | Value | Use |
|:---|:---:|:---|
| `--background` | `#050505` | Page background (deep black) |
| `--background-alt` | `#0c0c0c` | Subtle gradients |
| `--foreground` | `#f8f8f8` | Body text |
| `--primary` | `#00E0A2` | Cyber-green accent (CTAs, links) |
| `--primary-dark` | `#00A377` | Hover state |
| `--primary-light` | `#4DFFC9` | Highlights |
| `--secondary` | `#4260EC` | Electric blue |
| `--accent` | `#FA5252` | Coral red (badges) |
| `--heart` | `#FF3366` | Like button |
| `--card` | `#0A0A0A` | Card background |
| `--card-hover` | `#121212` | Card hover state |
| `--border` | `#222222` | Hairline dividers |
| `--muted` | `#171717` | Inputs, secondary surfaces |
| `--success` · `--warning` · `--danger` · `--info` | `10B981 · F59E0B · EF4444 · 3B82F6` | Feedback |

### Typography

| Family | CSS var | Where |
|:---|:---|:---|
| **Poppins** | `--font-poppins` | Headings (300-700) |
| **Montserrat** | `--font-montserrat` | UI / nav (400-700) |
| **Inter** | `--font-inter` | Body copy (400+) |

### Motion

- **Framer Motion** powers every card, tab indicator, modal and stagger.
- **Three.js + R3F** drives the particle field behind the profile page.
- **CSS keyframes** for low-cost loops: `glow`, `float`, `pulse`, `animate-fade-in`, `animate-pulse-subtle`.
- Spring-based `useScroll` / `useTransform` for scroll progress bars.

### Responsive breakpoints

| Width | Layout |
|:---:|:---|
| `< 640px` | 2-col wallpaper grid, hamburger menu |
| `640 – 1024px` | 3-col grid, condensed header |
| `> 1024px` | 4-col grid, full desktop nav, sticky header collapses to glass |

---

## 🔐 Authentication & Roles

| Role | Can do |
|:---|:---|
| **visitor** | Browse, search, view detail pages |
| **user** | Like, favorite, download, edit own profile |
| **moderator** | Edit any wallpaper's metadata (title, description, tags, featured flag) |
| **admin** | Everything moderators can do + manage roles + access `/admin` |

### How roles are stored

- **Custom claims** (server source of truth) — set with `npm run role`, enforced by `firestore.rules`.
- **`users/{uid}.roles` field** (client mirror) — read by `useUserRoles()` for fast UI gating (e.g. showing the *Admin* nav link).

### Security highlights

- Strong-password validator (10+ chars, mixed case, digit, symbol, no email leak, no repeats)
- Email verification required before sign-in
- Sign-in attempt rate-limiting via `lib/rate-limit.ts`
- Filename sanitization + MIME allow-list on `/upload`
- Path traversal protection on every file input
- External image URLs are re-hosted through Cloudinary before storage

---

## ☁️ Deployment

The project is **Vercel-first** (it already ships with a `proxy.ts` and Next.js config that assumes a Vercel-style environment).

### Deploy to Vercel

1. Push the repo to GitHub.
2. Import into Vercel.
3. Add all env vars from [⚙️ Environment Variables](#️-environment-variables) to the project settings.
   - Mark the `FIREBASE_SERVICE_ACCOUNT_*` ones as **server-only**.
4. Set the build command to `npm run build` (default).
5. Deploy. 🎉

### Required Firestore indexes

The `firestore.indexes.json` is committed — either deploy it via the Firebase CLI:

```bash
firebase deploy --only firestore:indexes,firestore:rules
```

…or let the Next.js app log the auto-generated index URL on the first request and click it.

---

## 🧪 Lint & Type-check

```bash
npm run lint        # ESLint (flat config)
npm run typecheck   # tsc --noEmit
```

Both pass cleanly on the current codebase. Add a pre-commit hook to enforce:

```bash
# .husky/pre-commit
npm run lint && npm run typecheck
```

---

## 🔥 Firebase Setup (Step-by-Step)

> Detailed walkthrough. If you've done this before, you can skip to [Quick Start](#-quick-start).

### 1 · Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** → name it (e.g. `tavryne-wallpapers`) → continue.
3. Disable Google Analytics for now (you can enable it later) → **Create project**.

### 2 · Enable Authentication

1. In the sidebar, go to **Build → Authentication** → **Get started**.
2. Sign-in method tab → enable the providers you want:
   - **Email/Password** (required for the standard flow)
   - **Google** (click it → enable → set project support email → save)
   - **GitHub** (click it → enable → you'll need a [GitHub OAuth App](https://github.com/settings/applications/new) with `https://YOUR_PROJECT.firebaseapp.com/__/auth/handler` as the callback URL)
3. Under **Settings → Authorized domains**, add your production domain (e.g. `tavrynewallpapers.vercel.app`) if it's not already there.

### 3 · Create the Firestore database

1. **Build → Firestore Database** → **Create database**.
2. Pick a location close to your users (e.g. `eur3 (europe-west)`).
3. Start in **production mode** (we ship our own rules).
4. After it's created, go to the **Rules** tab and paste the contents of [`firestore.rules`](firestore.rules) → **Publish**.
5. Go to the **Indexes** tab → enable the indexes from [`firestore.indexes.json`](firestore.indexes.json) (or run `firebase deploy --only firestore:indexes`).

### 4 · Register a Web App & copy credentials

1. Project Overview (⚙️) → **Project settings** → **General** → **Your apps** → click `</>` to add a web app.
2. Give it a nickname (e.g. `tavryne-web`) → register.
3. Copy the `firebaseConfig` object values into your `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza…
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
```

### 5 · Generate a service account (for the Admin SDK)

1. Project settings → **Service accounts** tab.
2. Click **Generate new private key** → **Generate key** → a JSON file downloads.
3. Pick **one** of these to expose it to the scripts:

```bash
# (a) local dev — drop the file in the project root
mv ~/Downloads/your-project-firebase-adminsdk-xxxxx.json ./serviceAccountKey.json
# (gitignored automatically)

# (b) Vercel — paste the entire JSON as the value of FIREBASE_SERVICE_ACCOUNT_KEY

# (c) local env var
export FIREBASE_SERVICE_ACCOUNT_PATH="$(pwd)/serviceAccountKey.json"
```

### 6 · (Recommended) Enable App Check

See the dedicated section below: [🛡️ Firebase App Check (reCAPTCHA)](#️-firebase-app-check-recaptcha).

---

## ☁️ Cloudinary Setup

The platform uses [Cloudinary](https://cloudinary.com/) for two things:
1. **Profile avatars** uploaded by users.
2. **Re-hosting external image URLs** pasted into the avatar modal (via `/api/reupload-image`).

### 1 · Create a Cloudinary account

1. Sign up at [cloudinary.com](https://cloudinary.com/) (free tier is plenty).
2. From the **Console** dashboard, note the **Cloud Name**, **API Key**, and **API Secret**.

### 2 · Create an unsigned upload preset

Unsigned presets let the browser upload directly without signing requests.

1. Settings → **Upload** → **Add upload preset**.
2. Set **Signing mode** to **Unsigned**.
3. Set **Folder** to `profile_pictures` (or whatever you prefer).
4. Enable **Restrict formats**: `jpg, png, webp, avif`.
5. Optionally enable **Eager transformations** for thumbnails.
6. Save → copy the **Preset name**.

### 3 · Add the credentials to `.env.local`

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

> 🔒 **Do not** put your `CLOUDINARY_API_SECRET` in any `NEXT_PUBLIC_*` variable. It's only needed for signed operations (which this app doesn't perform from the client).

### 4 · Test the round-trip

1. `npm run dev`, sign in, open `/profile`.
2. Click the camera icon on the avatar → **Upload** tab → pick any image.
3. The image should compress (browser-side, via `browser-image-compression`), upload to Cloudinary, and update your avatar in Firebase Auth + Firestore.

---

## 🛡️ Firebase App Check (reCAPTCHA)

App Check protects your backend (Firestore, Storage, Functions) from abuse by verifying requests come from your real app instance.

`lib/app-check.ts` ships with a production-safe wrapper that supports **both** standard reCAPTCHA v3 and reCAPTCHA Enterprise.

### 1 · Get a reCAPTCHA site key

1. Go to [https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin).
2. Register a new site:
   - **Label:** `Tavryne Wallpapers`
   - **reCAPTCHA type:** Score-based (v3) **or** Enterprise (if you have it).
   - **Domains:** `localhost`, your Vercel preview domain(s), and `tavrynewallpapers.vercel.app`.
3. Copy the **Site Key**.

### 2 · Add the key to `.env.local`

```env
# Standard reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc…

# OR for Enterprise
NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY=6Lc…
```

The helper picks v3 first and falls back to Enterprise automatically.

### 3 · Register the key in Firebase

1. Firebase Console → **Build → App Check**.
2. Click **Apps** → register your web app.
3. Pick **reCAPTCHA v3** or **reCAPTCHA Enterprise**, paste the same **Site Key**, and **Save**.
4. For Firestore: click the **enforcement** slider to start enforcing. Start with **monitor-only** for the first 24h to make sure legitimate traffic isn't blocked.

### 4 · Optional: debug token for local dev

When developing, your localhost traffic will fail App Check unless you register a debug token:

```js
// In your browser DevTools console (only on localhost):
self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
// Reload — copy the printed debug token, paste it into
// Firebase Console → App Check → Apps → Manage debug tokens
```

---

## 🗄️ Database Schema (Firestore)

All paths live under `(default)` database.

| Collection / Sub-collection | Document ID | Purpose | Key fields |
|:---|:---|:---|:---|
| `users/{uid}` | Firebase Auth `uid` | Public + private user profile | `displayName`, `email`, `photoURL`, `bio`, `provider`, `roles.{admin,moderator}`, `createdAt`, `lastLogin`, `isActive` |
| `wallpapers/{slug}` | wallpaper slug | Canonical wallpaper doc (Firestore-first read) | `slug`, `id` (legacy), `title`, `description`, `categoryId`, `tags[]`, `resolution`, `filename`, `featured`, `trending`, `uploadDate`, `uploaderId`, `createdAt`, `updatedAt`, `lastEditedBy`, `lastEditedAt` |
| `wallpaperStats/{id}` | numeric legacy `id` | Realtime counters (atomic increments) | `views`, `clicks`, `downloads`, `likes`, `favorites`, `lastViewed`, `lastDownloaded`, `lastClicked` |
| `wallpapers/{id}/views/{viewId}` | auto | Per-view records (analytics) | `wallpaperId`, `userId?`, `viewedAt`, `viewDuration`, `qualityScore`, `deviceInfo` |
| `wallpaperEditHistory/{slug}/edits/{editId}` | auto | Append-only audit trail | `wallpaperSlug`, `editedBy`, `editedByName`, `editedByEmail`, `changes`, `after`, `editedAt` |
| `favorites/{userId_wallpaperId}` | composite | Per-user favorites | `userId`, `wallpaperId`, `wallpaperSlug`, `wallpaperTitle`, `wallpaperThumbnail`, `createdAt` |
| `likes/{userId_wallpaperId}` | composite | Per-user likes | `userId`, `wallpaperId`, `createdAt` |
| `downloads/{downloadId}` | auto | Download history (incl. anonymous) | `userId?`, `wallpaperId`, `wallpaperSlug`, `resolution`, `deviceType`, `downloadedAt` |
| `impressions/{impressionId}` | auto | Grid/list impressions for analytics | `wallpaperId`, `userId?`, `position`, `source`, `timestamp` |
| `clicks/{clickId}` | auto | Detail-page clicks | `wallpaperId`, `userId?`, `source`, `timestamp` |
| `meta/{docId}` | e.g. `categories`, `tags` | Server-maintained reference data | varies |
| `rateLimits/{id}` | server-only | **Never** readable from client | — |

### Composite indexes (high-traffic queries)

`firestore.indexes.json` declares these so you don't have to wait for the "missing index" error email:

- `wallpapers` by `categoryId` + `featured` + `updatedAt`
- `wallpapers` by `categoryId` + `updatedAt`
- `wallpapers` by `featured` + `updatedAt`
- `wallpapers` by `trending` + `updatedAt`
- `wallpapers` by `tags` (array-contains) + `updatedAt`
- `wallpapers` by `updatedAt`
- `wallpapers` by `lastEditedBy` + `lastEditedAt`
- `edits` by `wallpaperSlug` + `editedAt`
- `edits` by `editedBy` + `editedAt`
- `edits` (collection-group) by `editedAt`
- `edits` (collection-group) by `editedBy` + `editedAt`
- `users` by `roles.moderator` + `email`
- `users` by `roles.admin` + `email`
- `users` by `roles.admin` + `displayName`
- `users` by `roles.moderator` + `displayName`

---

## 🔒 Security Rules Walkthrough

The full rules live in [`firestore.rules`](firestore.rules). Here's the mental model:

| Collection | Public read? | Who can write? |
|:---|:---:|:---|
| `users/{uid}` | ✅ (display fields only) | Owner can update profile **except** `roles`, `email`, `uid`, `provider`, `createdAt`, `isActive`. Only admins can delete. |
| `wallpapers/{slug}` | ✅ | Anyone signed in can create. **Moderators+** can update (slug/id/filename/uploaderId/createdAt locked). Only admins can delete. |
| `wallpaperEditHistory/{slug}/edits/{id}` | ✅ (transparency!) | Only moderators+, and `editedBy` must equal `request.auth.uid`. Append-only (admin can override). |
| `wallpaperStats/{id}` | ✅ | Anyone (used for atomic `increment()` from the client). |
| `wallpapers/{id}/views/{vid}` | ✅ | Anyone can write. |
| `favorites/{userId_wallpaperId}` | ✅ (counts only) | Owner only. ID pattern enforced. |
| `likes/{userId_wallpaperId}` | ✅ (counts only) | Owner only. ID pattern enforced. |
| `downloads/{id}` | Owner only | Anyone can create (for anonymous tracking). |
| `impressions`, `clicks` | ✅ | Anyone can write. |
| `meta/*` | ✅ | Admin only. |
| `rateLimits/*` | ❌ | Server-only (e.g. Cloud Functions). |

### Custom-claim helpers

```js
function isAdmin()      { return request.auth.token.admin      == true; }
function isModerator()  { return request.auth.token.moderator  == true
                              || request.auth.token.admin      == true; }
```

To rotate your own admin claim after losing access, run `npm run role add you@example.com admin` from a machine with the service account configured.

---

## 🗺️ Page-by-Page Tour

| Route | File | Render | What's there |
|:---|:---|:---:|:---|
| `/` | `app/page.tsx` | RSC | Hero with 3D particles, search, trending pills, **Featured** grid (6), **Browse Categories** (8), **All Wallpapers** (8), **Trending Wallpapers** (4), CTA. |
| `/all` | `app/all/page.tsx` | Dynamic | Full catalog grid, paginated. |
| `/categories/[categoryId]` | `app/categories/[categoryId]/page.tsx` | Dynamic | Filtered grid + back link. `categoryId=all` shows the full list. |
| `/tag/[tagId]` | `app/tag/[tagId]/page.tsx` | Dynamic | Filtered grid for a single tag (4k, 5k, 8k, etc.). |
| `/search` | `app/search/page.tsx` | Suspense | Query-string search across the catalog. |
| `/featured` | `app/featured/page.tsx` | Dynamic | Hand-curated featured wallpapers. |
| `/recent` | `app/recent/page.tsx` | Dynamic | Wallpapers ordered by `uploadDate`. |
| `/wallpaper/[slug]` | `app/wallpaper/[slug]/page.tsx` | RSC + client | Image preview, like, download (with device presets), share, related, edit-modal trigger for mods. |
| `/login` · `/signup` | `app/(auth)/…` | Client | Email/Google/GitHub sign-in with strong-password validation. |
| `/profile` | `app/profile/page.tsx` | Client | 3D particle field, avatar modal (upload/preset/URL), tabs: Overview · Favorites · Downloads · Settings. |
| `/favorites` | `app/favorites/` | Client | Per-user favorites grid. |
| `/downloads` | `app/downloads/` | Client | Per-user download history. |
| `/upload` | `app/upload/page.tsx` | Client | Drag-and-drop submit form (signed-in users only). |
| `/edits` | `app/edits/page.tsx` | ISR 30s | Live moderation log (recent wallpaper edits). |
| `/admin` | `app/admin/page.tsx` | Server | Admin dashboard (role-gated, noindex). |
| `/api/reupload-image` | `app/api/reupload-image/route.ts` | Route handler | Re-hosts an external image URL through Cloudinary (SSRF-protected). |
| `/sitemap.xml` | `app/sitemap.xml/route.ts` | ISR 1h | Google Image-Sitemap extension for wallpaper detail pages. |
| `/robots.txt` | `app/robots.ts` | Static | Per-bot allow/disallow rules. |

---

## 🛰️ API Reference

### `POST /api/reupload-image`

Server-side route that fetches an external image and re-hosts it on Cloudinary. Used by the profile avatar modal when a user pastes a URL.

**Request body**

```json
{ "imageUrl": "https://example.com/avatar.jpg" }
```

**Response (200)**

```json
{ "success": true, "imageUrl": "https://res.cloudinary.com/.../avatar_xxxxx.jpg" }
```

**Error responses**

| Status | Cause |
|:---:|:---|
| `400` | Invalid JSON, missing/empty `imageUrl`, blocked private IP, non-`http(s)` protocol, non-image content type, file > 10 MB, timeout, empty body |
| `500` | Cloudinary misconfiguration or upload failure |

**Security features** (in code):

- ✅ SSRF protection (blocks `localhost`, `127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, IPv6 private ranges)
- ✅ Protocol allow-list (`http`, `https` only)
- ✅ MIME allow-list (`jpeg`, `png`, `webp`, `avif` — no SVG, no GIF)
- ✅ 30-second fetch timeout
- ✅ 10 MB max file size
- ✅ `dynamic = "force-dynamic"` (no caching)

### Server actions (`app/actions/revalidate.ts`)

```ts
import { revalidateWallpaperPaths } from "@/app/actions/revalidate";

await revalidateWallpaperPaths("aurora-borealis", {
  categoryId: true,  // also flushes all /categories/* pages
  tags: true,        // also flushes all /tag/* pages
  featured: true,    // also flushes /featured
  trending: true,    // also flushes /
});
```

Called from the edit modal after a successful save to flush ISR caches for the affected pages.

---

## ➕ Adding New Wallpapers (3 Methods)

The fastest path. See **[guide.md](guide.md)** for the full long-form tutorial.

### Method 1 · Edit `app/lib/wallpapers.ts` (recommended for one-off additions)

```ts
{
  id: "41",
  title: "Aurora Borealis",
  description: "Northern lights illuminating the night sky above snowy mountains",
  filename: "41.jpg",
  slug: "aurora-borealis",
  categoryId: "nature",        // see `categories` array in the same file
  tags: ["4k", "night", "space"],
  views: 3050,
  downloads: 1550,
  likes: 420,
  featured: true,
  trending: true,
  uploadDate: "2026-06-01",
  resolution: "3840x2160",
},
```

Then run `npm run seed-wallpapers` to push it to Firestore.

### Method 2 · Use the loop (bulk generation)

```ts
// app/lib/wallpapers.ts — change the loop range:
for (let i = 11; i <= 60; i++) {
  // …pattern-based generation
}
```

### Method 3 · Drop an image + use the helper function

1. Save the image to `/public/wallpapers/41.jpg`.
2. Add to `app/lib/wallpapers.ts` (or call the helper):

```ts
addNewWallpaper(
  41,                                  // id
  "Aurora Borealis",                   // title
  "Northern lights…",                  // description
  "nature",                            // categoryId
  ["4k", "night", "space"],            // tags
  true,                                // featured
  true                                 // trending
);
```

3. `npm run seed-wallpapers` to sync to Firestore.

### Available category IDs

`abstract · nature · animals · space · dark · minimal · technology · cars · anime · architecture`

### Available tag IDs

`4k · 5k · 8k · hd · dark · gradient · black · blue · green · red · space · mountain · forest · ocean · night`

---

## 🛠️ Admin & Moderator Workflow

### Becoming the first admin

```bash
# 1. Sign up in the running app with your email
# 2. From a terminal, with the service account configured:
npm run role add you@example.com admin
# 3. Sign out and back in (or call refreshToken() from the dev console)
```

### Editing a wallpaper (as a moderator)

1. Sign in.
2. Open any `/wallpaper/[slug]` page.
3. Click the **Edit** button (only visible to mods+).
4. Modify title, description, category, tags, resolution, featured/trending flags.
5. Save → the change is written to `wallpapers/{slug}` **and** a new audit record is appended to `wallpaperEditHistory/{slug}/edits/{id}`.
6. ISR caches are automatically flushed (`/`, `/all`, `/recent`, `/featured`, `/sitemap.xml`, plus category/tag pages).

### Promoting another user

```bash
npm run role add colleague@example.com moderator
npm run role list                # confirm
npm run role get colleague@example.com
```

### Demoting / removing roles

```bash
npm run role remove colleague@example.com moderator
npm run role clear colleague@example.com
```

### Inspecting the edit log

Visit **`/edits`** in the browser (also linked from the footer) — it shows a live feed of all metadata changes with editor, timestamp, and field-level diffs.

---

## 🔍 SEO Playbook

The project ships with first-class SEO out of the box. Here's what it does and how to extend it.

### Per-page metadata

Every route file exports a `metadata` object (or `generateMetadata()` for dynamic routes). The root layout also defines:

- **Title template** — `%s | Tavryne Wallpapers`
- **Description + keywords** array
- **OpenGraph** + **Twitter Card** (using the 1200×630 `og-image.png`)
- **Canonical URL**
- **Robots** — admin/auth pages are `noindex,nofollow`
- **Theme color** — `#0a0a0a`
- **Manifest** — `/site.webmanifest`
- **Multi-resolution favicons** — SVG, ICO, PNG 16-512

### JSON-LD schemas (injected per page)

- `Organization` (root) — logo, socials, `disambiguatingDescription` for brand disambiguation
- `WebSite` (root) — `SearchAction` for the Sitelinks Search Box
- `ItemList` (home, featured) — list of featured wallpapers
- `BreadcrumbList` (helper exported from `layout.tsx`)
- `FAQPage` (helper)
- `CollectionPage` (helper)
- `ItemList` (helper)

To add a FAQ block to a page:

```ts
import { generateFAQSchema } from "@/app/layout"; // re-export the helpers

const faqLd = generateFAQSchema([
  { question: "Are the wallpapers free?", answer: "Yes — 100% free, no signup required to download." },
]);

<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
```

### Custom sitemap

[`app/sitemap.xml/route.ts`](app/sitemap.xml/route.ts) emits a Google Image-Sitemap extension so **Google Image Search** can read each wallpaper's `title` and `caption`. Configured with `revalidate = 3600` (ISR hourly).

### Robots

[`app/robots.ts`](app/robots.ts) declares per-bot rules (Googlebot, Googlebot-Image, Bingbot, facebookexternalhit, Twitterbot, LinkedInBot, Applebot, DuckDuckBot).

### Lighthouse quick-wins already in place

- ✅ AVIF + WebP via `next/image`
- ✅ `compress: true` and `generateEtags: true` in `next.config.ts`
- ✅ Security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS)
- ✅ HTTP→HTTPS redirect
- ✅ PWA manifest + apple-touch icons
- ✅ `lang="en"` + viewport meta
- ✅ Skip-to-main-content link for a11y
- ✅ ARIA labels on icon-only buttons

---

## 🎨 Customization Guide

### Change brand colors

Edit `app/styles.css` (lines 1-55) — all colors are CSS variables:

```css
:root {
  --primary: #00E0A2;       /* your new brand color */
  --primary-dark: #00A377;
  --secondary: #4260EC;
  --accent: #FA5252;
  /* … */
}
```

Tailwind's `theme.extend.colors` in `tailwind.config.js` reads from the same variables.

### Change fonts

Edit `app/layout.tsx` — add or remove a `next/font/google` call:

```ts
import { JetBrains_Mono } from 'next/font/google';

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});
```

Then bind it on `<html className={jetbrains.variable}>` and reference it in `styles.css` (`--font-mono: var(--font-mono), ui-monospace, monospace;`).

### Add a new category

```ts
// app/lib/wallpapers.ts
export const categories: WallpaperCategory[] = [
  // …existing
  { id: "sci-fi", name: "Sci-Fi", description: "Science fiction wallpapers" },
];
```

Then push to Firestore (the seed script also writes a derived count to `meta/categories`).

### Add a new tag

Same file, `tags` array. Tags are matched with `array-contains` queries, so the existing Firestore index covers any new tag automatically.

### Replace the logo

The logo is rendered as text (`logo-primary` + `logo-secondary` spans) in `Header.tsx` and `Footer.tsx`. To use an SVG, replace the spans with `<Image src="/logo.svg" … />`.

### Replace the hero background

Edit `app/page.tsx` (`hero-section`) or the dedicated `ParticleField.tsx` on the profile page.

---

## 🧯 Troubleshooting

<details>
<summary><b>"Firebase: Error (auth/invalid-api-key)"</b></summary>

One of your `NEXT_PUBLIC_FIREBASE_*` values is wrong/missing. Re-check `.env.local` against the Firebase Console, then restart `npm run dev` (env vars are baked at build/start time).
</details>

<details>
<summary><b>"Missing index" error in the console</b></summary>

Click the URL Firebase prints — it auto-creates the index for you. Or run `firebase deploy --only firestore:indexes` to apply `firestore.indexes.json` in bulk.
</details>

<details>
<summary><b>App Check blocks all requests in production</b></summary>

You probably forgot to register the reCAPTCHA **site key** in Firebase Console → App Check → Apps. Or your enforcement level is too aggressive — start in **monitor-only** mode for 24h before enforcing.
</details>

<details>
<summary><b>"permission-denied" when reading a wallpaper</b></summary>

Make sure you deployed [`firestore.rules`](firestore.rules). The default "test mode" rules expire after 30 days.
</details>

<details>
<summary><b>Avatars fail to upload (Cloudinary 400)</b></summary>

- Your upload preset must be **unsigned**.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` must match exactly.
- Check the Cloudinary dashboard → **Reports → Activity** for the actual error.
</details>

<details>
<summary><b>`npm run role` says "credentials not found"</b></summary>

Set one of: `FIREBASE_SERVICE_ACCOUNT_KEY`, `FIREBASE_SERVICE_ACCOUNT_PATH`, `GOOGLE_APPLICATION_CREDENTIALS`, or drop `serviceAccountKey.json` in the project root. See [Environment Variables](#️-environment-variables).
</details>

<details>
<summary><b>Hydration mismatch warnings</b></summary>

You're likely reading from `localStorage`/`sessionStorage` or `Date.now()` during render. Wrap it in `useEffect` or guard with `typeof window !== "undefined"`.
</details>

<details>
<summary><b>Build fails on Vercel with "Firestore credentials not found"</b></summary>

The Admin SDK only loads in `npm run role` / `npm run seed-wallpapers` (server-side scripts). If your **build** still references it, ensure you don't import `lib/admin.ts` from a client module. Use `import "server-only"` at the top of any module that uses it.
</details>

<details>
<summary><b>Images appear blurry on retina displays</b></summary>

Add `priority` to the first `next/image` on each page, and make sure the source is at least 2× the displayed size. The `next.config.ts` already enables AVIF/WebP and responsive `deviceSizes`.
</details>

---

## ❓ FAQ

<details>
<summary><b>Why Firestore + a static TypeScript array?</b></summary>

The static array is the **source of truth** for the catalog and is what `npm run seed-wallpapers` reads. Firestore is the **runtime source of truth** for moderator edits and per-user data. The pages read Firestore first and fall back to the static array — that way the build doesn't break if Firestore is empty, and moderators can edit titles/descriptions without redeploying.
</details>

<details>
<summary><b>Why a custom <code>proxy.ts</code> instead of <code>middleware.ts</code>?</b></summary>

`middleware.ts` is deprecated in Next.js 16. The project was migrated to the new `proxy.ts` convention, which supports the same `matcher` API.
</details>

<details>
<summary><b>Can I self-host this without Vercel?</b></summary>

Yes. Any Node 20+ host works (Render, Fly, Railway, your own VPS). Make sure to set the `NEXT_PUBLIC_*` env vars at **build time** (not just runtime), since Next.js inlines them.
</details>

<details>
<summary><b>How do I add a new auth provider?</b></summary>

1. Enable it in the Firebase Console.
2. Add a wrapper in `lib/auth.ts` (see `signInWithGoogle` / `signInWithGitHub` for the pattern).
3. Add a button in `app/login/page.tsx` and `app/signup/page.tsx`.
4. Add the provider icon to the CSP `script-src` / `frame-src` in `proxy.ts` if needed.
</details>

<details>
<summary><b>Is the catalog content licensed?</b></summary>

The current 40 wallpapers are bundled under the project's MIT license. When you add your own, make sure you have redistribution rights. The `/upload` page includes a license-agreement checkbox.
</details>

---

## 🌍 Browser Support

| Browser | Version | Notes |
|:---|:---:|:---|
| Chrome / Edge | latest 2 | ✅ Full support |
| Firefox | latest 2 | ✅ Full support |
| Safari (macOS / iOS) | 16+ | ✅ Full support (backdrop-filter fallback for older versions) |
| Samsung Internet | latest | ✅ |
| Opera | latest | ✅ |

IE 11 is **not** supported (Next.js 16 requires modern browsers).

---

## 🧑‍💻 Code Style

- **TypeScript strict mode** — no `any` unless absolutely unavoidable (and commented).
- **Server components by default** — add `"use client"` only when you need state, effects, or browser APIs.
- **CSS variables over magic values** — never hardcode colors or spacing; extend the design tokens in `app/styles.css`.
- **One component per file** — colocate `*.css` next to the component when scoped.
- **Kebab-case filenames**, **PascalCase components**, **camelCase hooks/utils**.
- **Imports** — group: 1) external, 2) `@/lib/*`, 3) `@/app/*`, 4) relative.
- **Commits** — `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `style:`, `test:` (Conventional Commits).

---

## 🤝 Contributing

PRs are welcome! Here's the recommended flow:

1. **Fork** the repo & create a feature branch
   ```bash
   git checkout -b feat/awesome-thing
   ```
2. Make your changes — please follow the existing folder layout, naming, and design tokens.
3. Add / update tests where it makes sense.
4. Run `npm run lint` and `npm run typecheck`.
5. Commit with a clear message (`feat:`, `fix:`, `chore:`, …).
6. Open a **Pull Request** describing the change and any screenshots.

> 💡 Adding a new wallpaper? The fastest path is editing `app/lib/wallpapers.ts` and running `npm run seed-wallpapers`. See **[guide.md](guide.md)** for a step-by-step walkthrough.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with ❤️ and a lot of caffeine using:

- [Next.js](https://nextjs.org) — the React framework
- [Vercel](https://vercel.com) — hosting & edge network
- [Firebase](https://firebase.google.com) — Auth, Firestore, App Check
- [Three.js](https://threejs.org) + [react-three-fiber](https://docs.pmnd.rs/react-three-fiber) — 3D
- [Framer Motion](https://www.framer.com/motion/) — animations
- [Lucide](https://lucide.dev) + [react-icons](https://react-icons.github.io/react-icons/) — icons
- [Cloudinary](https://cloudinary.com) — image storage & transformation
- All wallpaper artists & photographers featured in the catalog

---

## 📧 Contact

Questions, ideas, sponsorship?

- 🌐 **Live site** — [tavrynewallpapers.vercel.app](https://tavrynewallpapers.vercel.app)
- 🐙 **GitHub** — [pjprogrammers](https://github.com/pjprogrammers)
- ✉️ **Email** — pjprogrammers@gmail.com

---

<div align="center">

<sub>Made with 💚 using Next.js, Firebase & Three.js</sub>

<br>

⭐ **Star this repo** if you like it — it helps a lot!

<br>

![Stars](https://img.shields.io/github/stars/pjprogrammers/tavrynewallpapers?style=social)
![Forks](https://img.shields.io/github/forks/pjprogrammers/tavrynewallpapers?style=social)
![Watchers](https://img.shields.io/github/watchers/pjprogrammers/tavrynewallpapers?style=social)

</div>
