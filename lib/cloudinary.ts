/**
 * Cloudinary Upload Utility
 * Handles image compression, cropping, and upload to Cloudinary
 */

import imageCompression from "browser-image-compression";

/* =========================================================
   📋 CONFIGURATION
========================================================= */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxWidth: 1024,
  maxHeight: 1024,
  compressionQuality: 0.8,
  compressionMaxSize: 2 * 1024 * 1024, // Compress to under 2MB
  allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"] as const,
  acceptedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const,
};

/* =========================================================
   🔍 VALIDATION
========================================================= */

/**
 * Validate file type
 */
export const isValidImageType = (file: File): boolean => {
  return (UPLOAD_CONFIG.allowedTypes as readonly string[]).includes(file.type);
};

/**
 * Validate file extension
 */
export const isValidImageExtension = (filename: string): boolean => {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  return (UPLOAD_CONFIG.acceptedExtensions as readonly string[]).includes(ext);
};

/**
 * Validate file size
 */
export const isValidFileSize = (file: File): boolean => {
  return file.size <= UPLOAD_CONFIG.maxFileSize;
};

/**
 * Comprehensive file validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateImageFile = (file: File): ValidationResult => {
  if (!isValidImageType(file)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${(UPLOAD_CONFIG.allowedTypes as readonly string[]).join(", ")}`,
    };
  }

  if (!isValidFileSize(file)) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
};

/* =========================================================
   🖼️ IMAGE PROCESSING
========================================================= */

/**
 * Get image dimensions
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compress image using browser-image-compression
 */
export const compressImage = async (
  file: File,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
  }
): Promise<File> => {
  const compressionOptions = {
    maxSizeMB: options?.maxSizeMB || UPLOAD_CONFIG.compressionMaxSize / (1024 * 1024),
    maxWidthOrHeight: options?.maxWidthOrHeight || UPLOAD_CONFIG.maxWidth,
    useWebWorker: true,
    fileType: file.type as "image/jpeg" | "image/png" | "image/webp",
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    return compressedFile;
  } catch (error) {
    console.error("[Image Compression] Failed:", error);
    throw new Error("Failed to compress image");
  }
};

/**
 * Create a cropped canvas from an image
 */
export const createCroppedImage = (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  fileName: string,
  fileType: string = "image/jpeg"
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to create canvas context"));
        return;
      }

      // If crop dimensions are percentages (0-100), convert to pixels
      let cropX = pixelCrop.x;
      let cropY = pixelCrop.y;
      let cropW = pixelCrop.width;
      let cropH = pixelCrop.height;

      if (cropW <= 1) cropW = image.width * pixelCrop.width / 100;
      if (cropH <= 1) cropH = image.height * pixelCrop.height / 100;
      if (cropX <= 1) cropX = image.width * pixelCrop.x / 100;
      if (cropY <= 1) cropY = image.height * pixelCrop.y / 100;

      const size = Math.min(cropW, cropH);
      const startX = cropX + (cropW - size) / 2;
      const startY = cropY + (cropH - size) / 2;

      // Set canvas size to square crop (512x512)
      const outputSize = 512;
      canvas.width = outputSize;
      canvas.height = outputSize;

      // Draw cropped and resized image
      ctx.drawImage(
        image,
        startX,
        startY,
        size,
        size,
        0,
        0,
        outputSize,
        outputSize
      );

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob from canvas"));
            return;
          }

          // Create file from blob
          const croppedFile = new File([blob], fileName, {
            type: fileType,
            lastModified: Date.now(),
          });

          URL.revokeObjectURL(imageSrc);
          resolve(croppedFile);
        },
        fileType,
        UPLOAD_CONFIG.compressionQuality
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageSrc);
      reject(new Error("Failed to load image for cropping"));
    };

    image.src = imageSrc;
  });
};

/* =========================================================
   ☁️ CLOUDINARY UPLOAD
========================================================= */

/**
 * Upload image to Cloudinary
 */
export const uploadToCloudinary = async (
  file: File,
  options?: {
    folder?: string;
    publicId?: string;
    onProgress?: (progress: number) => void;
  }
): Promise<{ secureUrl: string; publicId: string }> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary configuration is missing");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  if (options?.folder) {
    formData.append("folder", options.folder);
  }

  if (options?.publicId) {
    formData.append("public_id", options.publicId);
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Upload failed");
    }

    const data = await response.json();

    return {
      secureUrl: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error("[Cloudinary Upload] Failed:", error);
    throw error;
  }
};

/* =========================================================
   🎯 FULL AVATAR UPLOAD PIPELINE
========================================================= */

/**
 * Complete avatar upload pipeline:
 * 1. Validate
 * 2. Compress
 * 3. Crop
 * 4. Upload
 * 5. Return URL
 */
export interface AvatarUploadResult {
  success: boolean;
  secureUrl?: string;
  error?: string;
}

export const uploadAvatar = async (
  file: File,
  pixelCrop: { x: number; y: number; width: number; height: number },
  userId: string
): Promise<AvatarUploadResult> => {
  try {
    // Step 1: Validate
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Step 2: Create cropped image
    const imageUrl = URL.createObjectURL(file);
    const croppedFile = await createCroppedImage(
      imageUrl,
      pixelCrop,
      `${userId}_avatar_${Date.now()}.jpg`,
      "image/jpeg"
    );

    // Step 3: Compress the cropped image
    const compressedFile = await compressImage(croppedFile, {
      maxSizeMB: 1, // Keep under 1MB for profile pics
      maxWidthOrHeight: 512, // 512x512 is good for avatars
    });

    // Step 4: Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(compressedFile, {
      folder: "avatars",
      publicId: `user_${userId}`,
    });

    return {
      success: true,
      secureUrl: uploadResult.secureUrl,
    };
  } catch (error) {
    console.error("[Avatar Upload] Pipeline failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
};

/* =========================================================
   🗑️ DELETE IMAGE (if needed)
========================================================= */

/**
 * Delete image from Cloudinary (requires signed request in production)
 * Note: For unsigned uploads, you cannot delete directly.
 * Use Cloudinary's auto-delete or webhook-based cleanup.
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  return false;
};

export default {
  validateImageFile,
  compressImage,
  createCroppedImage,
  uploadToCloudinary,
  uploadAvatar,
  getImageDimensions,
  UPLOAD_CONFIG,
};
