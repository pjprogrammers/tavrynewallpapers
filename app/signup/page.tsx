"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

import {
  signUpWithEmail,
  signInWithGoogle,
  signInWithGitHub,
} from "@/lib/auth";

import {
  Eye,
  EyeOff,
  Github,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { FcGoogle } from "react-icons/fc";
import "./signup.css";

export default function SignUpPage() {
  const router = useRouter();

  const { user } = useAuth();

  /**
   * Redirect authenticated users
   */
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const [displayName, setDisplayName] =
    useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  /**
   * Email signup handler
   */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError(null);

    setLoading(true);

    /**
     * Validation
     */
    if (!displayName.trim()) {
      setError("Please enter your name");

      setLoading(false);

      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email");

      setLoading(false);

      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters"
      );

      setLoading(false);

      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");

      setLoading(false);

      return;
    }

    try {
      const { error: authError } =
        await signUpWithEmail(
          email,
          password,
          displayName
        );

      if (authError) {
        throw new Error(authError);
      }

      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
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
      const { error: authError } =
        await signInWithGoogle();

      if (authError) {
        throw new Error(authError);
      }

      router.push("/");
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
      const { error: authError } =
        await signInWithGitHub();

      if (authError) {
        throw new Error(authError);
      }

      router.push("/");
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

  return (
    <main className="signup-page" role="main" id="main-content">
      <div className="signup-grid" />

      <div className="signup-glow signup-glow-one" />

      <div className="signup-glow signup-glow-two" />

      <section className="signup-card-wrapper" aria-label="Sign up form">
        <div className="signup-card">
          <div className="signup-card-shine" />

          {/* Header */}
          <header className="signup-header">
            <div className="signup-badge">
              <ShieldCheck size={18} />

              <span>
                Secure Authentication
              </span>
            </div>

            <h1>
              Join <span>Tavryne</span>
            </h1>

            <p>
              Create your account and build
              your personal wallpaper
              collection.
            </p>
          </header>

          {/* Error */}
          {error && (
            <div className="signup-error" role="alert">
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="signup-form"
            aria-label="Sign up credentials"
          >
            {/* Name */}
            <div className="signup-input-group">
              <label htmlFor="displayName">
                Full Name
              </label>

              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) =>
                  setDisplayName(e.target.value)
                }
                placeholder="Enter your name"
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="signup-input-group">
              <label htmlFor="email">
                Email Address
              </label>

              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="signup-input-group">
              <label htmlFor="password">
                Password
              </label>

              <div className="signup-password-wrapper">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  id="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Create password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="signup-input-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="signup-password-wrapper">
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev
                    )
                  }
                  className="password-toggle"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="signup-submit-btn"
            >
              <span>
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </span>

              <ArrowRight size={18} />
            </button>
          </form>

          {/* Divider */}
          <div className="signup-divider" role="separator">
            <span>
              OR CONTINUE WITH
            </span>
          </div>

          {/* OAuth Buttons */}
          <div className="signup-socials">
            {/* Google */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="social-btn"
              aria-label="Sign up with Google"
            >
              <FcGoogle size={22} />

              <span>Google</span>
            </button>

            {/* GitHub */}
            <button
              onClick={handleGitHubSignIn}
              disabled={loading}
              className="social-btn"
              aria-label="Sign up with GitHub"
            >
              <Github size={20} />

              <span>GitHub</span>
            </button>
          </div>

          {/* Login Link */}
          <footer className="signup-footer">
            <p>
              Already have an account?
            </p>

            <Link href="/login">
              Sign In
            </Link>
          </footer>
        </div>
      </section>
    </main>
  );
}