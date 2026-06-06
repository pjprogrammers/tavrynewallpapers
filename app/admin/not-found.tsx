"use client";

/**
 * 🛑 /admin not-found
 * Shown if the user navigates to a sub-route under /admin that
 * does not exist (e.g. /admin/foo). Falls back to the access-denied
 * screen so the dashboard's gating logic still applies.
 */
import { useEffect } from "react";
import Link from "next/link";
import { Shield, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminNotFound() {
  const router = useRouter();
  useEffect(() => {
    // Bounce back to /admin root so the gating screen renders.
    const t = setTimeout(() => router.replace("/admin"), 1500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="admin-denied">
      <Shield size={48} />
      <h1>Page not found</h1>
      <p>The admin route you requested doesn&rsquo;t exist. Redirecting to the dashboard…</p>
      <div className="admin-denied-actions">
        <Link href="/admin" className="admin-cta">
          Go to dashboard
        </Link>
        <Link href="/" className="admin-cta-secondary">
          <Home size={16} /> Home
        </Link>
      </div>
    </div>
  );
}
