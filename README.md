<!-- PROJECT: Tavryne Wallpapers -->
<!-- COMPREHENSIVE README WITH HTML STYLING -->
<!-- LAST UPDATED: 2026 -->

<div align="center">

# 🖼️ Tavryne Wallpapers

<a href="https://tavrynewallpapers.vercel.app" target="_blank">
  <img src="https://img.shields.io/badge/🌐 Visit Live Site-00E0A2?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
</a>

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

<p>A stunning, modern wallpaper discovery platform built with Next.js 16, featuring 3D animations, Firebase authentication, and a premium cyberpunk-inspired design.</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Email/Password, Google, and GitHub login via Firebase |
| 🖼️ **Wallpaper Gallery** | Browse, search, and filter wallpapers by category |
| ⬇️ **One-Click Downloads** | Download wallpapers in multiple resolutions |
| ❤️ **Favorites System** | Save and manage your favorite wallpapers |
| 📊 **Real-time Stats** | Track views, likes, and downloads |
| 👤 **User Profiles** | Custom avatars, bio, and settings |
| 🎨 **3D Animations** | Three.js particle effects and Framer Motion |
| 📱 **Fully Responsive** | Perfect on desktop, tablet, and mobile |

---

## 🛠️ Tech Stack

<div align="left">

**Frontend:**
- ⚛️ **Next.js 16** - React framework with App Router
- 🎯 **TypeScript** - Type-safe development
- 🎞️ **Framer Motion** - Smooth animations
- 🎮 **Three.js / React Three Fiber** - 3D graphics
- 💎 **Lucide React** - Icon system
- 🎨 **CSS Variables** - Custom design system

**Backend & Services:**
- 🔥 **Firebase Auth** - Authentication
- ☁️ **Firebase Firestore** - Database
- ☁️ **Cloudinary** - Image storage & optimization
- ▲ **Vercel** - Deployment platform

</div>

---

## 📸 Preview

<div align="center">

| Home Page | Profile |
|:--------:|:--------:|
| ![Home](https://via.placeholder.com/600x350/0d1117/00e0a2?text=Home+Page+Preview) | ![Profile](https://via.placeholder.com/600x350/0d1117/00e0a2?text=Profile+Preview) |
| *Hero Section with 3D Particles* | *Profile with Avatar Upload* |

| Categories | Wallpaper Details |
|:--------:|:--------:|
| ![Categories](https://via.placeholder.com/600x350/0d1117/00e0a2?text=Categories+Grid) | ![Wallpaper](https://via.placeholder.com/600x350/0d1117/00e0a2?text=Wallpaper+Detail) |
| *Category Cards with Hover Effects* | *Download & Stats Display* |

</div>

---

## 🚀 Quick Start Guide

### Prerequisites

Before you begin, make sure you have:

| Requirement | Version | Installation |
|-------------|---------|--------------|
| **Node.js** | 18.x or higher | [Download](https://nodejs.org/) |
| **npm** | 9.x or higher | Comes with Node.js |
| **Git** | Latest | [Download](https://git-scm.com/) |

### Step 1: Clone the Repository

```bash
# Open your terminal and run:
git clone https://github.com/pjprogrammers/tavrynewallpapers.git

# Navigate to the project folder:
cd tavrynewallpapers
```

### Step 2: Install Dependencies

```bash
# Install all required packages:
npm install

# If you prefer yarn:
# yarn install
```

### Step 3: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Cloudinary Configuration (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> ⚠️ **Important:** Replace all `your_*` values with your actual Firebase and Cloudinary credentials. See below for setup instructions.

### Step 4: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** (Google, Email/Password, GitHub providers)
4. Enable **Firestore Database**
5. Copy your credentials to `.env.local`

### Step 5: Set Up Cloudinary (Optional)

1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account
3. Copy your cloud name, API key, and API secret

### Step 6: Run the Development Server

```bash
# Start the development server:
npm run dev

# Open your browser and visit:
# ➜ http://localhost:3000
```

---

## 📁 Project Structure

```
tavrynewallpapers/
├── app/                          # Next.js App Router
│   ├── components/               # React components
│   │   ├── AvatarUpload.tsx    # Profile picture uploader
│   │   ├── FeaturedGridWithStats.tsx
│   │   ├── Header.tsx          # Navigation header
│   │   ├── WallpaperCard.tsx
│   │   └── WallpaperGridWithStats.tsx
│   ├── profile/                 # Profile page
│   │   ├── page.tsx            # Main profile component
│   │   ├── profile.css          # Profile styles
│   │   └── ParticleField.tsx   # Three.js background
│   ├── favorites/              # Favorites page
│   ├── downloads/              # Downloads page
│   ├── wallpaper/[slug]/      # Individual wallpaper
│   ├── categories/[categoryId]/
│   ├── search/
│   ├── page.tsx               # Home page
│   ├── styles.css             # Global styles
│   └── layout.tsx             # Root layout
├── lib/                        # Utilities & services
│   ├── auth.ts                # Firebase auth
│   ├── firebase.ts            # Firebase config
│   ├── firestore.ts           # Firestore operations
│   ├── cloudinary.ts          # Image upload
│   └── wallpapers.ts          # Wallpaper data
├── public/                     # Static assets
│   └── wallpapers/           # Wallpaper images
├── .env.local                 # Environment variables
├── package.json               # Dependencies
├── next.config.ts             # Next.js config
└── README.md                  # This file
```

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🎨 Design System

**Color Palette:**

```css
--background: #050505;        /* Deep black */
--foreground: #f8f8f8;        /* Clean white */
--primary: #00e0a2;           /* Cyber green */
--primary-dark: #00a377;
--secondary: #4260ec;        /* Electric blue */
--accent: #fa5252;            /* Coral red */
--card: #0a0a0a;              /* Card background */
--border: #222222;            /* Subtle borders */
--heart: #ff3366;             /* Like button red */
```

**Typography:**
- Headings: Poppins (600-700 weight)
- Body: Inter / Montserrat (400-500 weight)

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. Create a **feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. Open a **Pull Request**

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Vercel](https://vercel.com/) - Deployment & hosting
- [Firebase](https://firebase.google.com/) - Authentication & database
- [Three.js](https://threejs.org/) - 3D graphics
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Lucide](https://lucide.dev/) - Beautiful icons
- All wallpaper artists and photographers

---

## 📧 Contact

Have questions or suggestions? Reach out!

- 📧 **Email:** pjprogrammers@gmail.com
- 🐙 **GitHub:** [pjprogrammers](https://github.com/pjprogrammers)
- 🌐 **Live Site:** [tavrynewallpapers.vercel.app](https://tavrynewallpapers.vercel.app)

---

<div align="center">

**Made with ❤️ using Next.js, Firebase, and Three.js**

![GitHub stars](https://img.shields.io/github/stars/pjprogrammers/tavrynewallpapers?style=social)
![GitHub forks](https://img.shields.io/github/forks/pjprogrammers/tavrynewallpapers?style=social)

</div>

</div>