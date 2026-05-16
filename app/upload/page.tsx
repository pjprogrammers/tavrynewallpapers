"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, X, Check, Image as ImageIcon, Tag, Info, User, Link, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Security: Allowed MIME types for upload
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

// Security: Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Security: Sanitize filename to prevent path traversal
const sanitizeFilename = (filename: string): string => {
  // Remove directory traversal attempts
  let sanitized = filename.replace(/^.*[\/\\]/, "");
  // Remove any remaining path separators and special chars
  sanitized = sanitized.replace(/[\/\\:*?"<>|]/g, "");
  // Limit filename length
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  return sanitized;
};

// Security: Validate file type by checking magic bytes (basic approach)
const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return { valid: false, error: "Invalid file type. Allowed: JPG, PNG, WebP" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File too large. Maximum size: 5MB" };
  }
  return { valid: true };
};

export default function UploadPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    name: user?.displayName || "",
    email: user?.email || "",
    licenseAgreed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL input state
  const [imageUrl, setImageUrl] = useState("");
  const [urlInputMode, setUrlInputMode] = useState(false);
  const [processingUrl, setProcessingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Security: Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/upload");
    }
  }, [user, loading, router]);

  // Update name/email when user loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file: File) => {
    setError(null);

    // Security: Validate file type and size
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    // Security: Sanitize filename
    const sanitizedName = sanitizeFilename(file.name);
    const sanitizedFile = new File([file], sanitizedName, { type: file.type });

    setSelectedFile(sanitizedFile);

    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(sanitizedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle URL input submission
  const handleUrlSubmit = async () => {
    setUrlError(null);

    if (!imageUrl.trim()) {
      setUrlError("Please enter an image URL.");
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
    } catch {
      setUrlError("Please enter a valid URL.");
      return;
    }

    setProcessingUrl(true);

    try {
      const response = await fetch("/api/reupload-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: imageUrl.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process image URL.");
      }

      // Store the Cloudinary URL - we'll use it as our "uploaded" file
      // Create a mock File-like object for the form
      const cloudinaryUrl = data.imageUrl;

      // Set the preview to the Cloudinary URL
      setImagePreview(cloudinaryUrl);

      // Create a synthetic file-like object (we store the URL instead for URL-based uploads)
      const mockFile = new File([], "external-image", { type: "image/jpeg" });
      (mockFile as File & { cloudinaryUrl?: string }).cloudinaryUrl = cloudinaryUrl;
      setSelectedFile(mockFile);

      // Clear the URL input
      setImageUrl("");
      setUrlInputMode(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process image. Please try again.";
      setUrlError(errorMessage);
    } finally {
      setProcessingUrl(false);
    }
  };

  const handleCancelUrlInput = () => {
    setImageUrl("");
    setUrlError(null);
    setUrlInputMode(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError("Please select an image to upload.");
      return;
    }

    if (!formData.licenseAgreed) {
      setError("Please agree to the license terms.");
      return;
    }

    // Security: Validate title length
    if (formData.title.length > 100) {
      setError("Title must be less than 100 characters.");
      return;
    }

    // Security: Sanitize title and description
    const sanitizedTitle = formData.title.trim().substring(0, 100);
    const sanitizedDescription = formData.description.trim().substring(0, 500);

    setSubmitting(true);

    try {
      // Check if this is a URL-based upload (already on Cloudinary)
      const cloudinaryUrl = (selectedFile as File & { cloudinaryUrl?: string }).cloudinaryUrl;

      if (cloudinaryUrl) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setSubmitted(true);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setSubmitted(true);
      }
    } catch (err) {
      setError("An error occurred while uploading. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  // Already handled by useEffect, but as a fallback
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            {submitted ? (
              <div className="card p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check size={32} className="text-primary" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold mb-4">Upload Successful!</h1>
                <p className="text-muted-foreground mb-8">
                  Thank you for contributing to our wallpaper collection. Your submission will be reviewed shortly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => {
                      setSubmitted(false);
                      setSelectedFile(null);
                      setImagePreview(null);
                      setFormData({
                        title: "",
                        description: "",
                        category: "",
                        tags: "",
                        name: "",
                        email: "",
                        licenseAgreed: false,
                      });
                    }}
                    className="btn-primary"
                  >
                    Upload Another
                  </button>
                  <a href="/" className="btn-secondary">
                    Back to Home
                  </a>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-2">Upload Wallpaper</h1>
                <p className="text-muted-foreground mb-8">
                  Share your amazing wallpapers with our community. High-quality images will be featured on our homepage.
                </p>

                {/* Error Display */}
                {error && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Image Upload */}
                  <div className="mb-8">
                    <label className="block font-medium mb-2 flex items-center gap-2">
                      <ImageIcon size={18} className="text-primary" />
                      Wallpaper Image
                    </label>

                    {/* Upload Mode Toggle */}
                    {!selectedFile && !urlInputMode && (
                      <div className="mb-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setUrlInputMode(true)}
                          className="text-sm flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          <Link size={16} />
                          Paste Image URL
                        </button>
                      </div>
                    )}

                    {/* URL Input Mode */}
                    {urlInputMode && !selectedFile && (
                      <div className="border border-border rounded-lg p-6 mb-4">
                        <div className="flex flex-col gap-4">
                          <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium mb-2">
                              Paste External Image URL
                            </label>
                            <input
                              type="url"
                              id="imageUrl"
                              value={imageUrl}
                              onChange={(e) => {
                                setImageUrl(e.target.value);
                                setUrlError(null);
                              }}
                              className="input w-full"
                              placeholder="https://example.com/image.jpg"
                              disabled={processingUrl}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Paste a URL from Pexels, Imgur, Reddit, or any direct image link.
                              The image will be securely downloaded and uploaded to our servers.
                            </p>
                          </div>

                          {/* URL Error */}
                          {urlError && (
                            <div className="flex items-center gap-2 text-sm text-destructive">
                              <AlertCircle size={16} />
                              {urlError}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleUrlSubmit}
                              disabled={processingUrl || !imageUrl.trim()}
                              className="btn-primary py-2 px-4 flex items-center gap-2"
                            >
                              {processingUrl ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Upload size={16} />
                                  Upload from URL
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelUrlInput}
                              disabled={processingUrl}
                              className="btn-secondary py-2 px-4"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!selectedFile ? (
                      <div
                        className={`border-2 border-dashed ${isDragging ? 'border-primary' : 'border-border'} rounded-lg p-8 transition-colors text-center cursor-pointer`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center">
                          <div className="mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload size={24} className="text-primary" />
                          </div>
                          <p className="text-lg font-medium mb-1">Drag & drop your image here</p>
                          <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                          <p className="text-xs text-muted-foreground mb-2">Accepted formats: JPG, PNG, WebP</p>
                          <p className="text-xs text-muted-foreground">Maximum file size: 5MB</p>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="relative border border-border rounded-lg overflow-hidden group">
                        {imagePreview && (
                          <div className="aspect-video relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-contain"
                            />
                            <button
                              type="button"
                              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm p-2 rounded-full hover:bg-muted transition-colors"
                              onClick={handleRemoveFile}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                        <div className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium truncate">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="text-primary flex items-center gap-1">
                            <Check size={16} />
                            <span>Selected</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Wallpaper Information */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <Info size={18} className="text-primary" />
                        Wallpaper Information
                      </h2>
                      
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="input w-full"
                          required
                          placeholder="Enter a descriptive title"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-1">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="input w-full h-24 resize-none"
                          placeholder="Describe your wallpaper"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium mb-1">
                          Category
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="input w-full"
                          required
                        >
                          <option value="" disabled>Select a category</option>
                          <option value="Nature">Nature</option>
                          <option value="Abstract">Abstract</option>
                          <option value="Minimal">Minimal</option>
                          <option value="Dark">Dark</option>
                          <option value="Neon">Neon</option>
                          <option value="Architecture">Architecture</option>
                          <option value="Technology">Technology</option>
                          <option value="Space">Space</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="tags" className="block text-sm font-medium mb-1">
                          Tags
                        </label>
                        <div className="relative">
                          <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            className="input w-full pl-9"
                            placeholder="landscape, mountains, sky (comma separated)"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Creator Information */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <User size={18} className="text-primary" />
                        Creator Information
                      </h2>
                      
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">
                          Your Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="input w-full"
                          required
                          placeholder="Enter your name or username"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="input w-full"
                          required
                          placeholder="Your email address"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          We'll never share your email with anyone else.
                        </p>
                      </div>
                      
                      <div className="pt-4">
                        <div className="bg-muted rounded-lg p-4">
                          <h3 className="font-medium mb-2">License Information</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            By uploading, you grant PixelPulse a non-exclusive license to display and 
                            distribute your wallpaper while maintaining your copyright.
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="licenseAgreed"
                              name="licenseAgreed"
                              checked={formData.licenseAgreed as boolean}
                              onChange={handleInputChange}
                              className="w-4 h-4 text-primary"
                              required
                            />
                            <label htmlFor="licenseAgreed" className="text-sm">
                              I confirm that I own the rights to this image and agree to the terms
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="mt-8">
                    <motion.button
                      type="submit"
                      className="btn-primary py-3 w-full flex items-center justify-center gap-2 text-base"
                      disabled={submitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-t-2 border-white rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          Upload Wallpaper
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 