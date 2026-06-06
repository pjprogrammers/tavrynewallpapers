"use client";

import { useState, useEffect, Suspense } from "react";

import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/lib/auth-context";

import {
  signInWithEmail,
  signInWithGoogle,
  signInWithGitHub,
} from "@/lib/auth";

import { getAuth } from "@/lib/firebase";

import { sendPasswordResetEmail } from "firebase/auth";

import {
  Eye,
  EyeOff,
  Github,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { FcGoogle } from "react-icons/fc";

import "../signup/signup.css";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="signup-page" role="main" id="main-content">
      <section className="signup-card-wrapper" aria-label="Sign in form">
        <div className="signup-card" style={{ alignItems: "center" }}>
          <Loader2 size={32} className="animate-spin" />
          <p>Loading sign-in…</p>
        </div>
      </section>
    </main>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user } = useAuth();

  /**
   * Resolve the safe post-login destination. Reject open-redirect
   * attempts by only allowing same-origin paths that start with "/".
   */
  const getRedirect = (): string => {
    const raw = searchParams.get("redirect") || "/";
    if (typeof raw !== "string") return "/";
    if (!raw.startsWith("/")) return "/";
    if (raw.startsWith("//")) return "/";
    return raw;
  };

  useEffect(() => {
    if (user) {
      router.push(getRedirect());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const [resetMessage, setResetMessage] = useState<string | null>(null);

  /**
   * Email login handler
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setResetMessage(null);
    setLoading(true);

    if (!email.includes("@")) {
      setError("Please enter a valid email");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await signInWithEmail(email, password);

      if (authError) {
        throw new Error(authError);
      }

      router.push(getRedirect());
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Forgot Password Handler
   */
  const handleForgotPassword = async () => {
    setError(null);
    setResetMessage(null);

    if (!email.includes("@")) {
      setError("Enter your email first to reset password");
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(getAuth(), email);

      setResetMessage(
        "Password reset email sent! Check your inbox."
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Google sign in
   */
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await signInWithGoogle();

      if (authError) {
        throw new Error(authError);
      }

      router.push(getRedirect());
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Google sign in failed");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * GitHub sign in
   */
  const handleGitHubSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await signInWithGitHub();

      if (authError) {
        throw new Error(authError);
      }

      router.push(getRedirect());
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("GitHub sign in failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const redirectParam = searchParams.get("redirect");
  const signupHref = redirectParam
    ? `/signup?redirect=${encodeURIComponent(redirectParam)}`
    : "/signup";

  return (
    <main className="signup-page" role="main" id="main-content">
      <div className="signup-grid" />
      <div className="signup-glow signup-glow-one" />
      <div className="signup-glow signup-glow-two" />

      <section className="signup-card-wrapper" aria-label="Sign in form">
        <div className="signup-card">
          <div className="signup-card-shine" />

          {/* Header */}
          <header className="signup-header">
            <div className="signup-badge">
              <ShieldCheck size={18} />
              <span>Secure Login</span>
            </div>

            <h1>
              Welcome <span>Back</span>
            </h1>

            <p>
              Sign in and continue building your personal wallpaper collection.
            </p>
          </header>

          {/* Error / Success */}
          {error && <div className="signup-error" role="alert">{error}</div>}
          {resetMessage && (
            <div style={{ color: "#22c55e", marginBottom: "10px" }} role="status">
              {resetMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="signup-form" aria-label="Sign in credentials">
            {/* Email */}
            <div className="signup-input-group">
              <label htmlFor="email">Email Address</label>

              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="signup-input-group">
              <label htmlFor="password">Password</label>

              <div className="signup-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Forgot Password */}
              <div style={{ textAlign: "right", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#7c3aed",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="signup-submit-btn">
              <span>{loading ? "Signing In..." : "Sign In"}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Divider */}
          <div className="signup-divider" role="separator">
            <span>OR CONTINUE WITH</span>
          </div>

          {/* OAuth Buttons */}
          <div className="signup-socials">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="social-btn"
              aria-label="Sign in with Google"
            >
              <FcGoogle size={22} />
              <span>Google</span>
            </button>

            <button
              onClick={handleGitHubSignIn}
              disabled={loading}
              className="social-btn"
              aria-label="Sign in with GitHub"
            >
              <Github size={20} />
              <span>GitHub</span>
            </button>
          </div>

          {/* Footer */}
          <footer className="signup-footer">
            <p>Don&apos;t have an account?</p>
            <Link href={signupHref}>Create Account</Link>
          </footer>
        </div>
      </section>
    </main>
  );
}
