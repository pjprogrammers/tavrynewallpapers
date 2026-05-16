"use client";

import {
  Camera,
  Upload,
  Link2,
  ImageIcon,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile, useUserFavorites, useUserDownloads } from "@/lib/use-firestore";
import {
  User,
  Settings,
  Edit3,
  Save,
  Mail,
  Calendar,
  LogOut,
  Heart,
  Download,
  Star,
  ChevronRight,
  Sparkles,
  Grid3X3,
  Palette,
  Bell,
  Shield,
  Zap,
} from "lucide-react";
import { signOut as firebaseSignOut, updateAuthProfile, updateUserFirestoreProfile } from "@/lib/auth";
import "./profile.css";

import Header from "@/app/components/Header";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import dynamic from "next/dynamic";

const AnimatedBackground = dynamic(() => import("./AnimatedBackgroundLazy").then(mod => mod.AnimatedBackground), {
  ssr: false,
  loading: () => <div className="animated-background" />
});

type TabKey = "overview" | "favorites" | "downloads" | "settings";

interface ProfileFormData {
  displayName: string;
  photoURL: string;
  bio: string;
}

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <Sparkles size={18} /> },
  { key: "favorites", label: "Favorites", icon: <Heart size={18} /> },
  { key: "downloads", label: "Downloads", icon: <Download size={18} /> },
  { key: "settings", label: "Settings", icon: <Settings size={18} /> },
];

const DEFAULT_BIO = "Passionate wallpaper enthusiast exploring digital aesthetics.";
const MAX_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 160;

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  const { favorites } = useUserFavorites();
  const { downloads } = useUserDownloads();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const scrollTarget = isMounted && containerRef.current ? containerRef : undefined;
  const { scrollYProgress } = useScroll({ target: scrollTarget });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Avatar modal state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarTab, setAvatarTab] = useState<"upload" | "preset" | "url">("upload");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: "",
    photoURL: "",
    bio: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName ?? "",
        photoURL: user.photoURL ?? "",
        bio: (profile as any)?.bio ?? DEFAULT_BIO,
      });
      setAvatarUrl(user.photoURL ?? "");
    }
  }, [user, profile]);

  // ---------- Cloudinary upload (uses your existing env vars) ----------
  const handleAvatarUpload = async (newPhotoUrl: string) => {
    if (!user) return;
    try {
      setAvatarUrl(newPhotoUrl);
      // Update both Auth and Firestore
      await updateAuthProfile(user, { photoURL: newPhotoUrl });
      await updateUserFirestoreProfile(user.uid, { photoURL: newPhotoUrl });
      router.refresh();
    } catch (err) {
      console.error("[Profile] Failed to update avatar:", err);
      setError("Failed to save avatar. Please try again.");
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Upload failed");
    return data.secure_url;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, GIF).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const url = await uploadToCloudinary(file);
      await handleAvatarUpload(url);
      setShowAvatarModal(false);
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePresetSelect = async (url: string) => {
    setUploadingAvatar(true);
    try {
      await handleAvatarUpload(url);
      setShowAvatarModal(false);
    } catch (err) {
      setError("Failed to apply preset avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      setError("Please enter a valid image URL.");
      return;
    }
    try {
      new URL(urlInput);
    } catch {
      setError("Invalid URL format.");
      return;
    }
    setUploadingAvatar(true);
    setError(null);
    try {
      // Rehost external URL through Cloudinary first
      const response = await fetch("/api/reupload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: urlInput.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || "Failed to process image URL");
      }

      // Use the Cloudinary URL, not the original external URL
      const cloudinaryUrl = data.imageUrl;
      await handleAvatarUpload(cloudinaryUrl);
      setShowAvatarModal(false);
      setUrlInput("");
    } catch (err) {
      console.error("[Profile] URL upload failed:", err);
      setError(err instanceof Error ? err.message : "Failed to load image from URL.");
    } finally {
      setUploadingAvatar(false);
    }
  };
  // ----------------------------------------------------------------

  const displayAvatarUrl = useMemo(() => {
    if (avatarUrl) return avatarUrl;
    if (user?.photoURL) return user.photoURL;
    // Default fallback to local avatar
    return "/avatars_preset/aiden.svg";
  }, [avatarUrl, user?.photoURL]);

  const memberSince = useMemo(() => {
    const created = (user as any)?.metadata?.creationTime;
    if (!created) return "Recently joined";
    try {
      return new Date(created).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      });
    } catch {
      return "Recently joined";
    }
  }, [user]);

  const handleFieldChange = useCallback(
    <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleCancel = useCallback(() => {
    if (user) {
      setFormData({
        displayName: user.displayName ?? "",
        photoURL: user.photoURL ?? "",
        bio: (profile as any)?.bio ?? DEFAULT_BIO,
      });
    }
    setError(null);
    setIsEditing(false);
  }, [user, profile]);

  const handleSave = useCallback(async () => {
    const name = formData.displayName.trim();
    if (!name) { setError("Display name cannot be empty."); return; }
    if (name.length > MAX_NAME_LENGTH) {
      setError(`Display name must be under ${MAX_NAME_LENGTH} characters.`);
      return;
    }
    if (formData.bio.length > MAX_BIO_LENGTH) {
      setError(`Bio must be under ${MAX_BIO_LENGTH} characters.`);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const result = await updateAuthProfile(user!, {
        displayName: name,
        photoURL: formData.photoURL.trim() || undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }

      await updateUserFirestoreProfile(user!.uid, {
        displayName: name,
        photoURL: formData.photoURL.trim() || undefined,
      });

      const { doc, setDoc } = await import("firebase/firestore");
      const { getDB } = await import("@/lib/firebase");
      const { COLLECTIONS } = await import("@/lib/firestore");
      const userRef = doc(getDB(), COLLECTIONS.USERS, user!.uid);
      await setDoc(userRef, { bio: formData.bio.trim() }, { merge: true });

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error("[Profile] Save failed:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [formData, router, user]);

  const handleSignOut = useCallback(async () => {
    try {
      await firebaseSignOut();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }, [router]);

  if (authLoading) {
    return (
      <div className="profile-page">
        <AnimatedBackground />
        <div className="profile-loading">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 size={48} />
          </motion.div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading profile...
          </motion.span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <AnimatedBackground />
        <motion.div
          className="profile-unauthenticated"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="unauthenticated-glow" />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <User size={64} className="unauthenticated-icon" />
          </motion.div>
          <h1>Welcome Back</h1>
          <p>Sign in to access your profile and manage your wallpapers</p>
          <Link href="/login" className="profile-login-link">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign in
            </motion.span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="profile-page" ref={containerRef} style={{ position: 'relative' }}>
      <AnimatedBackground />
      <Header />

      <motion.div
        className="profile-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Hero Section */}
        <motion.section
          className="profile-hero"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="hero-glow" />

          <motion.div
            className="profile-avatar-section"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="avatar-container">
              <Image
                src={displayAvatarUrl}
                alt={`${user.displayName || "User"} avatar`}
                width={200}
                height={200}
                className="profile-avatar"
                priority
                unoptimized
              />
              <button
                onClick={() => setShowAvatarModal(true)}
                className="avatar-edit-btn"
                aria-label="Change avatar"
              >
                <Camera size={24} />
              </button>
            </div>
          </motion.div>

          <div className="profile-info-section">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {isEditing ? (
                <motion.div
                  className="profile-edit-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleFieldChange("displayName", e.target.value)}
                    maxLength={MAX_NAME_LENGTH}
                    placeholder="Display name"
                    className="profile-input-name"
                    whileFocus={{ scale: 1.02 }}
                  />
                  <motion.textarea
                    value={formData.bio}
                    onChange={(e) => handleFieldChange("bio", e.target.value)}
                    maxLength={MAX_BIO_LENGTH}
                    placeholder="Tell us about yourself"
                    className="profile-input-bio"
                    rows={2}
                    whileFocus={{ scale: 1.02 }}
                  />
                  <div className="profile-edit-meta">
                    <span className="profile-char-count">
                      {formData.displayName.length}/{MAX_NAME_LENGTH}
                    </span>
                    <span className="profile-bio-count">
                      {formData.bio.length}/{MAX_BIO_LENGTH}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <>
                  <h1 className="profile-name">
                    <motion.span
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      {user.displayName || "Anonymous User"}
                    </motion.span>
                  </h1>
                  <motion.p
                    className="profile-bio"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    {formData.bio || DEFAULT_BIO}
                  </motion.p>
                </>
              )}

              <div className="profile-meta">
                <motion.span
                  className="profile-meta-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Mail size={14} />
                  {user.email}
                </motion.span>
                <motion.span
                  className="profile-meta-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Calendar size={14} />
                  Joined {memberSince}
                </motion.span>
              </div>
            </motion.div>

                      </div>

          <motion.div
            className="profile-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="action-buttons"
                >
                  <motion.button
                    onClick={handleSave}
                    disabled={saving}
                    className="profile-btn profile-btn-primary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {saving ? "Saving" : "Save"}
                  </motion.button>
                  <motion.button
                    onClick={handleCancel}
                    disabled={saving}
                    className="profile-btn profile-btn-secondary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={16} />
                    Cancel
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="edit"
                  onClick={() => setIsEditing(true)}
                  className="profile-btn profile-btn-primary"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Edit3 size={16} />
                  Edit profile
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="profile-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Tabs */}
        <motion.nav
          className="profile-tabs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          {TABS.map((tab, index) => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`profile-tab ${activeTab === tab.key ? "active" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 + index * 0.1 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {activeTab === tab.key && (
                <motion.div
                  className="tab-indicator"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </motion.nav>

        {/* Tab Content */}
        <section className="profile-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "overview" && <OverviewTab profile={profile} downloads={downloads} favorites={favorites} />}
              {activeTab === "favorites" && <FavoritesTab favorites={favorites} />}
              {activeTab === "downloads" && <DownloadsTab downloads={downloads} />}
              {activeTab === "settings" && <SettingsTab onSignOut={handleSignOut} />}
            </motion.div>
          </AnimatePresence>
        </section>
      </motion.div>

      {/* GitHub‑style Avatar Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <motion.div
            className="avatar-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAvatarModal(false)}
          >
            <motion.div
              className="avatar-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="avatar-modal-header">
                <h3>Change profile picture</h3>
                <button className="avatar-modal-close" onClick={() => setShowAvatarModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="avatar-tabs">
                <button
                  className={`avatar-tab ${avatarTab === "upload" ? "active" : ""}`}
                  onClick={() => setAvatarTab("upload")}
                >
                  <Upload size={16} /> Upload
                </button>
                <button
                  className={`avatar-tab ${avatarTab === "preset" ? "active" : ""}`}
                  onClick={() => setAvatarTab("preset")}
                >
                  <ImageIcon size={16} /> Preset
                </button>
                <button
                  className={`avatar-tab ${avatarTab === "url" ? "active" : ""}`}
                  onClick={() => setAvatarTab("url")}
                >
                  <Link2 size={16} /> Paste URL
                </button>
              </div>

              <div className="avatar-modal-body">
                {avatarTab === "upload" && (
                  <div className="avatar-upload-area">
                    <label className="avatar-file-label">
                      <Upload size={32} />
                      <span>Click to upload</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif"
                        onChange={handleFileUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>
                    <p className="avatar-hint">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}

                {avatarTab === "preset" && (
                  <div className="avatar-preset-grid">
                    {[
                      "/avatars_preset/memo_30.png",
                      "/avatars_preset/memo_17.png",
                      "/avatars_preset/memo_5.png",
                      "/avatars_preset/memo_7.png",
                      "/avatars_preset/memo_35.png",
                      "/avatars_preset/memo_4.png",
                      "/avatars_preset/memo_29.png",
                      "/avatars_preset/memo_26.png",
                      "/avatars_preset/memo_31.png",
                      "/avatars_preset/memo_32.png",
                      "/avatars_preset/memo_22.png",
                      "/avatars_preset/memo_16.png",
                      "/avatars_preset/aiden.svg",
                      "/avatars_preset/oliver.svg",
                      "/avatars_preset/brian.svg",
                      "/avatars_preset/sara.svg",
                      "/avatars_preset/girl.svg",
                      "/avatars_preset/3d_4.png",
                      "/avatars_preset/robo.svg",
                    ].map((url, idx) => (
                      <button
                        key={idx}
                        className="avatar-preset-item"
                        onClick={() => handlePresetSelect(url)}
                        disabled={uploadingAvatar}
                      >
                        <Image src={url} width={80} height={80} alt="Preset avatar" unoptimized />
                      </button>
                    ))}
                  </div>
                )}

                {avatarTab === "url" && (
                  <div className="avatar-url-area">
                    <input
                      type="text"
                      placeholder="https://example.com/avatar.jpg"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="avatar-url-input"
                      disabled={uploadingAvatar}
                    />
                    <button
                      onClick={handleUrlSubmit}
                      disabled={uploadingAvatar || !urlInput.trim()}
                      className="avatar-url-submit"
                    >
                      {uploadingAvatar ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                      Apply
                    </button>
                  </div>
                )}

                {uploadingAvatar && (
                  <div className="avatar-uploading">
                    <Loader2 size={24} className="animate-spin" />
                    <span>Updating avatar...</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// ==================== TABS COMPONENTS (unchanged) ====================
function OverviewTab({ profile, downloads, favorites }: { profile: any; downloads: any[]; favorites: any[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const scrollTarget = isMounted && containerRef.current ? containerRef : undefined;
  const { scrollYProgress } = useScroll({ target: scrollTarget });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="tab-overview" ref={containerRef} style={{ position: 'relative' }}>
      <motion.div
        className="overview-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="card-header">
          <Sparkles size={24} className="card-icon" />
          <h2>About You</h2>
        </div>
        <p className="card-content">
          {profile?.bio || "Passionate wallpaper enthusiast exploring digital aesthetics. Always looking for the perfect backdrop for every screen."}
        </p>
        <div className="card-decoration" />
      </motion.div>

      <motion.div
        className="overview-stats-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="stats-title">Your Journey</h2>
        <div className="overview-stats">
          <motion.div
            className="overview-stat"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="stat-circle stat-circle-green">
              <Star size={24} />
            </div>
            <span className="stat-number">{(profile as any)?.wallpaperCount || 0}</span>
            <span className="stat-label">Wallpapers</span>
          </motion.div>
          <motion.div
            className="overview-stat"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="stat-circle stat-circle-blue">
              <Download size={24} />
            </div>
            <span className="stat-number">{downloads.length}</span>
            <span className="stat-label">Downloads</span>
          </motion.div>
          <motion.div
            className="overview-stat"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="stat-circle stat-circle-purple">
              <Heart size={24} />
            </div>
            <span className="stat-number">{favorites.length}</span>
            <span className="stat-label">Favorites</span>
          </motion.div>
        </div>
        <div className="stats-progress">
          <motion.div
            className="progress-line"
            style={{ height: lineHeight }}
          />
        </div>
      </motion.div>

      <motion.div
        className="overview-achievements"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h2 className="achievements-title">Achievements</h2>
        <div className="achievements-grid">
          <motion.div
            className="achievement-item"
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="achievement-icon">🎨</div>
            <span>First Favorite</span>
          </motion.div>
          <motion.div
            className="achievement-item"
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="achievement-icon">⬇️</div>
            <span>First Download</span>
          </motion.div>
          <motion.div
            className="achievement-item"
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="achievement-icon">⭐</div>
            <span>Profile Complete</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function FavoritesTab({ favorites }: { favorites: any[] }) {
  if (!favorites || favorites.length === 0) {
    return (
      <motion.div
        className="empty-state"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="empty-glow" />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Heart size={64} className="empty-icon" />
        </motion.div>
        <h3>No favorites yet</h3>
        <p>Start exploring wallpapers and save your favorites here.</p>
        <Link href="/" className="empty-state-btn">
          <motion.span
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Browse wallpapers
          </motion.span>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="tab-favorites"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="favorites-grid">
        {favorites.map((favorite, index) => (
          <motion.div
            key={favorite.id}
            className="favorite-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <div className="favorite-image-container">
              <Image
                src={favorite.wallpaperThumbnail || "/wallpapers/placeholder.jpg"}
                alt={favorite.wallpaperTitle}
                fill
                className="favorite-image"
              />
              <div className="favorite-overlay" />
            </div>
            <div className="favorite-info">
              <h3>{favorite.wallpaperTitle}</h3>
              <Link href={`/wallpaper/${favorite.wallpaperSlug}`} className="favorite-link">
                View <ChevronRight size={16} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function DownloadsTab({ downloads }: { downloads: any[] }) {
  if (!downloads || downloads.length === 0) {
    return (
      <motion.div
        className="empty-state"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="empty-glow" />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Download size={64} className="empty-icon" />
        </motion.div>
        <h3>No downloads yet</h3>
        <p>Your downloaded wallpapers will appear here.</p>
        <Link href="/" className="empty-state-btn">
          <motion.span
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Discover wallpapers
          </motion.span>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="tab-downloads"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="downloads-grid">
        {downloads.map((download, index) => (
          <motion.div
            key={download.id}
            className="download-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <div className="download-info">
              <h3>{download.wallpaperSlug}</h3>
              <p>{download.resolution} • {download.deviceType}</p>
              <span className="download-date">
                {download.downloadedAt?.toDate?.()?.toLocaleDateString() || "Recently"}
              </span>
            </div>
            <Link href={`/wallpaper/${download.wallpaperSlug}`} className="download-link">
              <motion.span whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Download size={20} />
              </motion.span>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

interface SettingsTabProps {
  onSignOut: () => void;
}

function SettingsTab({ onSignOut }: SettingsTabProps) {
  const settingsItems = [
    { icon: <Grid3X3 size={20} />, label: "Appearance", description: "Customize the look and feel" },
    { icon: <Bell size={20} />, label: "Notifications", description: "Manage your notification preferences" },
    { icon: <Shield size={20} />, label: "Privacy", description: "Control your data and privacy" },
    { icon: <Palette size={20} />, label: "Content", description: "Manage content preferences" },
    { icon: <Zap size={20} />, label: "Accessibility", description: "Improve your experience" },
  ];

  return (
    <motion.div
      className="tab-settings"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="settings-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2>Account Settings</h2>
        <p className="settings-description">
          Manage your account preferences and settings.
        </p>
      </motion.div>

      <div className="settings-list">
        {settingsItems.map((item, index) => (
          <motion.button
            key={item.label}
            className="settings-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            whileHover={{ x: 5, backgroundColor: "rgba(34, 197, 94, 0.1)" }}
          >
            <span className="settings-icon">{item.icon}</span>
            <div className="settings-item-content">
              <span className="settings-label">{item.label}</span>
              <span className="settings-item-desc">{item.description}</span>
            </div>
            <ChevronRight size={20} className="settings-chevron" />
          </motion.button>
        ))}
      </div>

      <motion.div
        className="settings-danger"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <button onClick={onSignOut} className="profile-signout-btn">
          <LogOut size={18} />
          Sign out of your account
        </button>
      </motion.div>
    </motion.div>
  );
}