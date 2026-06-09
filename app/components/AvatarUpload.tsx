"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Camera,
  X,
  Check,
  Loader2,
  AlertCircle,
  Upload,
  ImageIcon,
  Link2,
  FileIcon,
  MousePointer2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { updateUserPhotoURL } from "@/lib/auth";
import { uploadAvatar, validateImageFile } from "@/lib/cloudinary";
import { motion, AnimatePresence } from "framer-motion";

/* =========================================================
   📱 AVATAR UPLOAD - GITHUB-STYLE DESIGN
========================================================= */

interface AvatarUploadProps {
  onUploadSuccess?: (url: string) => void;
  size?: "small" | "medium" | "large";
  className?: string;
  id?: string;
  showLabel?: boolean;
}

const SIZE_CLASSES = {
  small: "avatar-upload-small",
  medium: "avatar-upload-medium",
  large: "avatar-upload-large",
};

// GitHub-style preset avatars (local assets)
const PRESET_AVATARS = [
  { seed: "Adventurous", color: "#22c55e", src: "/avatars_preset/aiden.svg" },
  { seed: "Creative", color: "#3b82f6", src: "/avatars_preset/brian.svg" },
  { seed: "Dreamy", color: "#8b5cf6", src: "/avatars_preset/girl.svg" },
  { seed: "Energetic", color: "#f59e0b", src: "/avatars_preset/oliver.svg" },
  { seed: "Friendly", color: "#ec4899", src: "/avatars_preset/sara.svg" },
  { seed: "Gentle", color: "#06b6d4", src: "/avatars_preset/robo.svg" },
  { seed: "Happy", color: "#10b981", src: "/avatars_preset/memo_4.png" },
  { seed: "Idealistic", color: "#6366f1", src: "/avatars_preset/3d_4.png" },
];

type TabType = "upload" | "choose" | "url";

interface TabConfig {
  id: TabType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  {
    id: "upload",
    label: "Upload",
    description: "Upload from your device",
    icon: <Upload size={18} />
  },
  {
    id: "choose",
    label: "Choose",
    description: "Pick a preset avatar",
    icon: <ImageIcon size={18} />
  },
  {
    id: "url",
    label: "URL",
    description: "Use image from link",
    icon: <Link2 size={18} />
  },
];

export const AvatarUpload = ({
  onUploadSuccess,
  size = "medium",
  className = "",
  id,
  showLabel = false,
}: AvatarUploadProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlPreview, setUrlPreview] = useState<string | null>(null);
  const [urlError, setUrlError] = useState(false);
  const [urlProcessing, setUrlProcessing] = useState(false);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!showModal) {
      setError(null);
      setUploadProgress(0);
      setUrlInput("");
      setUrlPreview(null);
      setUrlError(false);
    }
  }, [showModal]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showModal]);

  /* =========================================================
     📁 FILE HANDLING
  ========================================================= */

  const processFile = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 15, 90));
    }, 80);

    try {
      const defaultCrop = { x: 0, y: 0, width: 100, height: 100 };
      const result = await uploadAvatar(file, defaultCrop, user!.uid);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result.success || !result.secureUrl) {
        throw new Error(result.error || "Upload failed");
      }

      await updateUserPhotoURL(user!, result.secureUrl);

      if (onUploadSuccess) {
        onUploadSuccess(result.secureUrl);
      }

      // Show success briefly then close
      setTimeout(() => {
        setShowModal(false);
        setIsUploading(false);
        setUploadProgress(0);
      }, 800);
    } catch (err) {
      clearInterval(progressInterval);
      console.error("[AvatarUpload] Failed:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
    }
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      processFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- processFile is recreated each render; stable ref is enough
    []
  );

  const handleUrlSubmit = async () => {
    if (!user) {
      return;
    }

    if (!urlInput.trim()) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setUrlProcessing(true);

    try {
      if (!urlInput.match(/^https?:\/\/.+/i)) {
        throw new Error("Please enter a valid URL starting with http:// or https://");
      }

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

      // Save the Cloudinary URL (not the original external URL)
      const cloudinaryUrl = data.imageUrl;

      // Show Cloudinary preview BEFORE saving (CSP allows this)
      setUrlPreview(cloudinaryUrl);

      // Then save to user profile
      await updateUserPhotoURL(user, cloudinaryUrl);

      if (onUploadSuccess) {
        onUploadSuccess(cloudinaryUrl);
      }

      setShowModal(false);
      setUrlInput("");
    } catch (err) {
      console.error("[AvatarUpload] URL failed:", err);
      setError(err instanceof Error ? err.message : "Failed to process and save URL");
    } finally {
      setIsUploading(false);
      setUrlProcessing(false);
    }
  };

  const handleAvatarSelect = async (seed: string) => {
    if (!user) return;

    setIsUploading(true);
    setError(null);

    try {
      const preset = PRESET_AVATARS.find(p => p.seed === seed);
      const avatarUrl = preset?.src || `/avatars_preset/aiden.svg`;
      await updateUserPhotoURL(user, avatarUrl);

      if (onUploadSuccess) {
        onUploadSuccess(avatarUrl);
      }

      setShowModal(false);
    } catch (err) {
      console.error("[AvatarUpload] Selection failed:", err);
      setError(err instanceof Error ? err.message : "Failed to save avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlPreview = (url: string) => {
    setUrlInput(url);
    // Never render external URL directly - only show after rehosting
    if (url.match(/^https?:\/\/.+/i)) {
      setUrlPreview(null); // Clear any previous preview
      setUrlError(false);
    } else {
      setUrlPreview(null);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  /* =========================================================
     🎨 RENDER - MODAL (GitHub-style)
  ========================================================= */

  if (showModal) {
    return (
      <div
        className="gh-modal-overlay"
        onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
      >
        <div className="gh-modal">
          {/* Header */}
          <div className="gh-modal-header">
            <h2 className="gh-modal-title">Upload Avatar</h2>
            <button
              className="gh-modal-close"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Navigation - GitHub style */}
          <div className="gh-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`gh-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="gh-tab-icon">{tab.icon}</span>
                <div className="gh-tab-content">
                  <span className="gh-tab-label">{tab.label}</span>
                  <span className="gh-tab-desc">{tab.description}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="gh-modal-body">
            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="gh-alert gh-alert-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload Tab */}
            {activeTab === "upload" && (
              <div className="gh-tab-pane">
                <div
                  ref={dropZoneRef}
                  className={`gh-dropzone ${isDragging ? "dragging" : ""} ${isUploading ? "uploading" : ""}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                >
                  <input
                    ref={fileInputRef}
                    id="gh-avatar-file"
                    name="gh-avatar-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleFileSelect}
                    className="gh-hidden-input"
                  />

                  {isUploading ? (
                    <div className="gh-dropzone-uploading">
                      <div className="gh-progress">
                        <div
                          className="gh-progress-bar"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="gh-progress-text">Uploading... {uploadProgress}%</span>
                    </div>
                  ) : (
                    <div className="gh-dropzone-content">
                      <div className="gh-dropzone-icon">
                        <Upload size={32} />
                      </div>
                      <p className="gh-dropzone-title">
                        Drag and drop your image here
                      </p>
                      <p className="gh-dropzone-subtitle">
                        or click to browse files
                      </p>
                      <span className="gh-dropzone-hint">
                        PNG, JPG, GIF up to 10MB
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Choose Tab - GitHub preset style */}
            {activeTab === "choose" && (
              <div className="gh-tab-pane">
                <div className="gh-presets">
                  {PRESET_AVATARS.map((avatar) => (
                    <button
                      key={avatar.seed}
                      className="gh-preset-btn"
                      onClick={() => handleAvatarSelect(avatar.seed)}
                      disabled={isUploading}
                    >
                      <Image
                        src={avatar.src}
                        alt={avatar.seed}
                        width={48}
                        height={48}
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
                <p className="gh-presets-hint">
                  Click to select a preset avatar
                </p>
              </div>
            )}

            {/* URL Tab */}
            {activeTab === "url" && (
              <div className="gh-tab-pane">
                <div className="gh-url-input-group">
                  <label className="gh-label">Image URL</label>
                  <div className="gh-input-wrapper">
                    <input
                      type="url"
                      id="gh-avatar-url"
                      name="gh-avatar-url"
                      value={urlInput}
                      onChange={(e) => handleUrlPreview(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      className="gh-input"
                      disabled={isUploading}
                    />
                  </div>

                  {/* Processing indicator - never render external URL directly */}
                  {urlProcessing && (
                    <div className="gh-url-preview">
                      <span className="gh-url-preview-label">Processing...</span>
                      <div className="gh-url-preview-img flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Downloading and rehosting image to Cloudinary...
                      </p>
                    </div>
                  )}

                  {/* Cloudinary preview - only show AFTER rehosting completes */}
                  {!urlProcessing && urlPreview && !urlError && (
                    <div className="gh-url-preview">
                      <span className="gh-url-preview-label">Preview</span>
                      <div className="gh-url-preview-img">
                        <Image
                          src={urlPreview}
                          alt="Preview"
                          width={200}
                          height={200}
                          unoptimized
                          onError={() => setUrlError(true)}
                          style={{ width: "100%", height: "auto", maxWidth: 200 }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleUrlSubmit}
                    disabled={isUploading || !urlInput.trim() || urlError}
                    className="gh-btn gh-btn-primary"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="gh-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Set as avatar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     🎨 RENDER - TRIGGER BUTTON
  ========================================================= */

  return (
    <div className={`avatar-upload-wrapper ${SIZE_CLASSES[size]} ${className}`} id={id}>
      <button
        onClick={() => setShowModal(true)}
        className="avatar-upload-trigger"
        title="Change profile picture"
        id={id ? `${id}-btn` : undefined}
      >
        <Camera size={size === "small" ? 14 : size === "medium" ? 18 : 22} />
        {showLabel && <span>Change</span>}
      </button>
    </div>
  );
};

export default AvatarUpload;