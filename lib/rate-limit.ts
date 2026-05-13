/**
 * Client-side Rate Limiting using sessionStorage
 * More efficient than Firestore for rate limiting
 */

/* =========================================================
   📋 CONSTANTS
========================================================= */

export const RATE_LIMITS = {
  LIKES_PER_MINUTE: 60,
  DOWNLOADS_PER_MINUTE: 20,
  WINDOW_MS: 60 * 1000, // 1 minute window
} as const;

/* =========================================================
   🔍 RATE LIMIT CHECK
========================================================= */

/**
 * Check if action is rate limited
 */
export const isRateLimited = (
  action: "like" | "download"
): { limited: boolean; retryAfter?: number; currentCount: number } => {
  const key = `rate_limit_${action}`;
  const now = Date.now();

  const stored = sessionStorage.getItem(key);

  if (!stored) {
    return { limited: false, currentCount: 0 };
  }

  try {
    const data = JSON.parse(stored);
    const { count, windowStart } = data;

    // Check if window has expired
    if (now - windowStart > RATE_LIMITS.WINDOW_MS) {
      return { limited: false, currentCount: 0 };
    }

    const maxActions =
      action === "like"
        ? RATE_LIMITS.LIKES_PER_MINUTE
        : RATE_LIMITS.DOWNLOADS_PER_MINUTE;

    if (count >= maxActions) {
      const retryAfter = Math.ceil((windowStart + RATE_LIMITS.WINDOW_MS - now) / 1000);
      return { limited: true, retryAfter, currentCount: count };
    }

    return { limited: false, currentCount: count };
  } catch {
    return { limited: false, currentCount: 0 };
  }
};

/* =========================================================
   ⬆️ INCREMENT RATE LIMIT
========================================================= */

/**
 * Record an action and increment the rate limit counter
 * Returns false if rate limited, true if recorded successfully
 */
export const recordAction = (
  action: "like" | "download"
): { success: boolean; retryAfter?: number; currentCount: number } => {
  const key = `rate_limit_${action}`;
  const now = Date.now();
  const maxActions =
    action === "like"
      ? RATE_LIMITS.LIKES_PER_MINUTE
      : RATE_LIMITS.DOWNLOADS_PER_MINUTE;

  const stored = sessionStorage.getItem(key);

  let count = 0;
  let windowStart = now;

  if (stored) {
    try {
      const data = JSON.parse(stored);
      count = data.count || 0;
      windowStart = data.windowStart || now;

      // Reset if window expired
      if (now - windowStart > RATE_LIMITS.WINDOW_MS) {
        count = 0;
        windowStart = now;
      }
    } catch {
      count = 0;
      windowStart = now;
    }
  }

  // Check limit
  if (count >= maxActions) {
    const retryAfter = Math.ceil((windowStart + RATE_LIMITS.WINDOW_MS - now) / 1000);
    return { success: false, retryAfter, currentCount: count };
  }

  // Increment
  count++;

  // Save
  sessionStorage.setItem(
    key,
    JSON.stringify({
      count,
      windowStart,
      lastAction: now,
    })
  );

  return { success: true, currentCount: count };
};

/* =========================================================
   🗑️ CLEAR RATE LIMIT (for testing)
========================================================= */

export const clearRateLimit = (action?: "like" | "download") => {
  if (action) {
    sessionStorage.removeItem(`rate_limit_${action}`);
  } else {
    sessionStorage.removeItem("rate_limit_like");
    sessionStorage.removeItem("rate_limit_download");
  }
};

/* =========================================================
   ⏱️ FORMATTED ERROR MESSAGES
========================================================= */

export const getRateLimitError = (
  action: "like" | "download",
  retryAfter: number
): string => {
  if (action === "like") {
    return `Like limit reached. Please wait ${retryAfter} seconds before liking more wallpapers.`;
  } else {
    return `Download limit reached. Please wait ${retryAfter} seconds before downloading more wallpapers.`;
  }
};

export default {
  isRateLimited,
  recordAction,
  clearRateLimit,
  getRateLimitError,
  RATE_LIMITS,
};
