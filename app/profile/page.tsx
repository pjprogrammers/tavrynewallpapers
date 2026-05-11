"use client";

import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  User,
  Settings,
  Activity,
  Edit3,
  Save,
  X,
  Loader2,
  Mail,
  Calendar,
  Shield,
  LogOut,
  Camera,
} from "lucide-react";

import { signOut as firebaseSignOut } from "@/lib/auth";
import "./profile.css";

/* =========================================================
 * TYPES
 * ========================================================= */
type TabKey = "overview" | "activity" | "settings";

interface TabConfig {
  key: TabKey;
  label: string;
  icon: ReactNode;
}

interface ProfileFormData {
  displayName: string;
  bio: string;
}

interface StatItem {
  label: string;
  value: string | number;
}

/* =========================================================
 * CONSTANTS
 * ========================================================= */
const TABS: TabConfig[] = [
  { key: "overview", label: "Overview", icon: <User size={16} /> },
  { key: "activity", label: "Activity", icon: <Activity size={16} /> },
  { key: "settings", label: "Settings", icon: <Settings size={16} /> },
];

const DEFAULT_BIO =
  "Passionate creator exploring digital aesthetics, UI design, and wallpaper art.";

const MAX_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 200;

/* =========================================================
 * PROFILE PAGE
 * ========================================================= */
export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: "",
    bio: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName ?? "",
        bio: (user as any).bio ?? DEFAULT_BIO,
      });
    }
  }, [user]);

  const avatarUrl = useMemo(() => {
    if (user?.photoURL) return user.photoURL;
    const seed = encodeURIComponent(user?.displayName || user?.email || "User");
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
  }, [user?.photoURL, user?.displayName, user?.email]);

  const memberSince = useMemo(() => {
    const created = (user as any)?.metadata?.creationTime;
    if (!created) return "Recently joined";
    try {
      return new Date(created).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
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
        bio: (user as any).bio ?? DEFAULT_BIO,
      });
    }
    setError(null);
    setIsEditing(false);
  }, [user]);

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
      // TODO: real Firebase update
      await new Promise((res) => setTimeout(res, 800));
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error("[Profile] Save failed:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [formData, router]);

  const handleSignOut = useCallback(async () => {
    try {
      await firebaseSignOut();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <Loader2 className="animate-spin" size={24} />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-unauthenticated">
          <Shield size={48} />
          <h1>You are not signed in</h1>
          <p>Please log in to view and manage your profile.</p>
          <Link href="/login" className="profile-login-link">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="profile-page">
      {/* Background grid and glows */}
      <div className="profile-grid" />
      <div className="profile-glow profile-glow-one" />
      <div className="profile-glow profile-glow-two" />

      <div className="profile-content">
        {/* ============ PROFILE HEADER CARD (3D) ============ */}
        <div className="profile-3d-card">
          <div className="profile-card-shine" />
          <div className="profile-card-body">
            <div className="profile-avatar-wrapper">
              <Image
                src={avatarUrl}
                alt={`${user.displayName || "User"} avatar`}
                fill
                sizes="96px"
                className="profile-avatar"
                unoptimized
              />
              <div className="profile-avatar-overlay">
                <Camera size={18} />
              </div>
            </div>

            <div className="profile-info">
              {isEditing ? (
                <div className="profile-name-edit">
                  <label htmlFor="displayName" className="sr-only">Display Name</label>
                  <input
                    id="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleFieldChange("displayName", e.target.value)}
                    maxLength={MAX_NAME_LENGTH}
                    placeholder="Display name"
                    className="profile-input"
                  />
                  <span className="profile-char-count">
                    {formData.displayName.length}/{MAX_NAME_LENGTH}
                  </span>
                </div>
              ) : (
                <h1 className="profile-display-name">
                  {user.displayName || "Anonymous User"}
                </h1>
              )}

              <p className="profile-email">
                <Mail size={14} />
                {user.email}
              </p>
              <p className="profile-member-since">
                <Calendar size={14} />
                Member since {memberSince}
              </p>
            </div>

            <div className="profile-edit-actions">
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="profile-edit-btn">
                  <Edit3 size={16} /> Edit
                </button>
              ) : (
                <div className="profile-save-group">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="profile-save-btn"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="profile-cancel-btn"
                    aria-label="Cancel editing"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div role="alert" className="profile-error">
              {error}
            </div>
          )}
        </div>

        {/* ============ TABS ============ */}
        <nav role="tablist" aria-label="Profile sections" className="profile-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              id={`tab-${tab.key}`}
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`profile-tab ${activeTab === tab.key ? "profile-tab-active" : ""}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ============ TAB CONTENT ============ */}
        <section
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="profile-tab-content"
        >
          {activeTab === "overview" && (
            <OverviewTab
              bio={formData.bio}
              isEditing={isEditing}
              onBioChange={(v) => handleFieldChange("bio", v)}
            />
          )}
          {activeTab === "activity" && <ActivityTab />}
          {activeTab === "settings" && <SettingsTab onSignOut={handleSignOut} />}
        </section>

        <footer className="profile-footer">
          Secure Profile System • Powered by Firebase Auth
        </footer>
      </div>
    </main>
  );
}

/* =========================================================
 * SUB-COMPONENTS
 * ========================================================= */

interface OverviewTabProps {
  bio: string;
  isEditing: boolean;
  onBioChange: (value: string) => void;
}

function OverviewTab({ bio, isEditing, onBioChange }: OverviewTabProps) {
  const stats: StatItem[] = [
    { label: "Wallpapers", value: "128" },
    { label: "Downloads", value: "2.4K" },
    { label: "Likes", value: "320" },
    { label: "Uploads", value: "45" },
  ];

  const recentActivity = [
    "Uploaded Neon Cyberpunk Wallpaper",
    "Downloaded Minimal Dark Pack",
    "Liked Abstract Grid Design",
  ];

  return (
    <div className="overview-tab">
      <div className="profile-stats">
        {stats.map((s) => (
          <div key={s.label} className="profile-stat-card">
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="profile-bio-section">
        <h2>Bio</h2>
        {isEditing ? (
          <>
            <textarea
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              maxLength={MAX_BIO_LENGTH}
              rows={4}
              className="profile-textarea"
            />
            <span className="profile-char-count">
              {bio.length}/{MAX_BIO_LENGTH}
            </span>
          </>
        ) : (
          <p>{bio}</p>
        )}
      </div>

      <div className="profile-recent">
        <h2>Recent Activity</h2>
        <ul>
          {recentActivity.map((item) => (
            <li key={item}>
              <span className="check-icon">✔</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ActivityTab() {
  return (
    <div className="activity-tab">
      <h2>Activity Feed</h2>
      <p>Your full activity timeline will appear here when you start interacting with wallpapers.</p>
    </div>
  );
}

interface SettingsTabProps {
  onSignOut: () => void;
}

function SettingsTab({ onSignOut }: SettingsTabProps) {
  const settings = [
    "Change password",
    "Update email",
    "Privacy settings",
    "Delete account",
  ];

  return (
    <div className="settings-tab">
      <h2>Account Settings</h2>
      <ul className="settings-list">
        {settings.map((s) => (
          <li key={s} className="settings-item">
            • {s}
          </li>
        ))}
      </ul>
      <button onClick={onSignOut} className="profile-signout-btn">
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}