import { getAdminDb } from "./firebase-admin";

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  favorite: { max: 60, windowMs: 60_000 },
  download: { max: 20, windowMs: 60_000 },
};

export async function checkServerRateLimit(
  userId: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const config = RATE_LIMITS[action];
  if (!config) return { allowed: true };

  const db = getAdminDb();
  if (!db) return { allowed: true };

  const ref = db.collection("rateLimits").doc(`${userId}_${action}`);
  const now = Date.now();

  try {
    const doc = await ref.get();
    if (!doc.exists) {
      await ref.set({ count: 1, windowStart: now, action, userId });
      return { allowed: true };
    }

    const data = doc.data()!;
    const windowStart = data.windowStart as number;
    const count = data.count as number;

    if (now - windowStart > config.windowMs) {
      await ref.update({ count: 1, windowStart: now });
      return { allowed: true };
    }

    if (count >= config.max) {
      const retryAfter = Math.ceil((windowStart + config.windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }

    await ref.update({ count: count + 1 });
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}
