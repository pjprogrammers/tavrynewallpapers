import { NextRequest, NextResponse } from "next/server";

// Generate unique ID without external dependency
function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/* =========================================================
   🔒 SECURITY CONSTANTS
========================================================= */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const FETCH_TIMEOUT = 30000; // 30 seconds

// Allowed image MIME types (NO SVG, NO GIF)
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

// Private network patterns to block (SSRF protection)
const BLOCKED_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^::1$/,
  /^0\.0\.0\.0$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // Link-local
  /^fc00:/i, // IPv6 private
  /^fe80:/i, // IPv6 link-local
];

/* =========================================================
   🔍 URL VALIDATION
========================================================= */

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function isValidUrl(urlString: string): ValidationResult {
  try {
    const url = new URL(urlString);

    // Only allow http and https
    if (!["http:", "https:"].includes(url.protocol)) {
      return { valid: false, error: "Invalid protocol. Only HTTP and HTTPS are allowed." };
    }

    // Check for blocked hostnames (localhost, etc)
    const hostname = url.hostname.toLowerCase();

    // Check exact localhost
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return { valid: false, error: "Localhost URLs are not allowed." };
    }

    // Check for private IP patterns
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (ipPattern.test(hostname)) {
      for (const pattern of BLOCKED_IP_PATTERNS) {
        if (pattern.test(hostname)) {
          return { valid: false, error: "Private network addresses are not allowed." };
        }
      }
    }

    // Check for blocked protocols in hostname
    if (hostname.includes("file:") || hostname.includes("ftp:")) {
      return { valid: false, error: "Invalid URL format." };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format." };
  }
}

/* =========================================================
   📥 IMAGE DOWNLOAD
========================================================= */

async function downloadImage(url: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PixelPulse/1.0)",
        "Accept": "image/*",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Check content type
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.startsWith("image/")) {
      throw new Error("URL does not point to an image.");
    }

    // Validate it's an allowed image type (NO SVG, NO GIF)
    const allowedTypes = [...ALLOWED_MIME_TYPES];
    const isAllowedType = allowedTypes.some(
      (type) => contentType.toLowerCase().includes(type)
    );

    if (!isAllowedType) {
      throw new Error(`Image type not allowed. Allowed types: JPEG, PNG, WebP, AVIF.`);
    }

    // Get array buffer and convert to buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`Image too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    if (buffer.length === 0) {
      throw new Error("Downloaded image is empty.");
    }

    return {
      buffer,
      contentType: contentType.includes("image/jpeg") ? "image/jpeg" :
                  contentType.includes("image/png") ? "image/png" :
                  contentType.includes("image/webp") ? "image/webp" :
                  contentType.includes("image/avif") ? "image/avif" : "image/jpeg",
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }
      throw error;
    }
    throw new Error("Failed to download image.");
  }
}

/* =========================================================
   ☁️ CLOUDINARY UPLOAD
========================================================= */

async function uploadToCloudinary(buffer: Buffer, contentType: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration is missing.");
  }

  // Generate unique filename
  const uniqueId = generateUniqueId();
  const publicId = `avatar_${uniqueId}`;
  const extension = contentType.replace("image/", "");

  // Convert buffer to base64 for upload
  const base64Data = buffer.toString("base64");
  const dataUri = `data:${contentType};base64,${base64Data}`;

  const formData = new FormData();
  formData.append("file", dataUri);
  formData.append("upload_preset", uploadPreset);
  formData.append("public_id", publicId);
  formData.append("folder", "profile_pictures");
  formData.append("resource_type", "image");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to upload to Cloudinary.");
  }

  const data = await response.json();
  return data.secure_url;
}

/* =========================================================
   🚀 API HANDLER
========================================================= */

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: { imageUrl?: string };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { imageUrl } = body;

    // Validate imageUrl exists
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Image URL is required." },
        { status: 400 }
      );
    }

    // Trim and validate URL
    const trimmedUrl = imageUrl.trim();

    if (!trimmedUrl) {
      return NextResponse.json(
        { success: false, error: "Image URL cannot be empty." },
        { status: 400 }
      );
    }

    // Validate URL format and security
    const urlValidation = isValidUrl(trimmedUrl);
    if (!urlValidation.valid) {
      return NextResponse.json(
        { success: false, error: urlValidation.error },
        { status: 400 }
      );
    }

    // Download image
    let downloadedImage: { buffer: Buffer; contentType: string };

    try {
      downloadedImage = await downloadImage(trimmedUrl);
    } catch (downloadError) {
      const errorMessage = downloadError instanceof Error
        ? downloadError.message
        : "Failed to download image.";

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    let cloudinaryUrl: string;

    try {
      cloudinaryUrl = await uploadToCloudinary(
        downloadedImage.buffer,
        downloadedImage.contentType
      );
    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error
        ? uploadError.message
        : "Failed to upload to Cloudinary.";

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }

    // Success - return Cloudinary URL
    return NextResponse.json({
      success: true,
      imageUrl: cloudinaryUrl,
    });

  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// Disable caching for security
export const dynamic = "force-dynamic";