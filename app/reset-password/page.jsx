"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Dialog, Button, Field, Input } from "@/app/components/dashboard/ui";
import { cn } from "@/lib/utils";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg";

const fieldClass =
  "h-12 w-full rounded-control border border-mgh-line-strong bg-mgh-surface px-4 text-[15px] text-mgh-text placeholder:text-mgh-dim " +
  "outline-none transition-[border-color,box-shadow] duration-200 hover:border-mgh-dim " +
  "focus-visible:border-mgh-gold focus-visible:ring-3 focus-visible:ring-mgh-gold/20 aria-invalid:border-mgh-danger/70";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Reset password states
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Overlay states (in case user opened /reset-password directly without prior OTP)
  const [overlayStep, setOverlayStep] = useState(null); // 'email' | 'otp' | null
  const [overlayEmail, setOverlayEmail] = useState("");
  const [overlayEmailLoading, setOverlayEmailLoading] = useState(false);
  const [overlayEmailError, setOverlayEmailError] = useState(null);
  const [overlayOtp, setOverlayOtp] = useState("");
  const [overlayOtpLoading, setOverlayOtpLoading] = useState(false);
  const [overlayOtpError, setOverlayOtpError] = useState(null);
  const [overlayResendCooldown, setOverlayResendCooldown] = useState(false);

  useEffect(() => {
    const qEmail = searchParams.get("email");
    const qToken = searchParams.get("token");

    const storedEmail =
      typeof window !== "undefined"
        ? sessionStorage.getItem("mgh_reset_email")
        : null;
    const storedToken =
      typeof window !== "undefined"
        ? sessionStorage.getItem("mgh_reset_token")
        : null;

    const resolvedEmail = qEmail || storedEmail || "";
    const resolvedToken = qToken || storedToken || "";

    if (resolvedEmail) {
      setEmail(resolvedEmail);
      setToken(resolvedToken);
      setOverlayStep(null);
    } else {
      // No email session verified yet — prompt for email in overlay over blurred page
      setOverlayStep("email");
    }
  }, [searchParams]);

  // Handle overlay Email submit
  async function handleOverlayEmailSubmit(e) {
    e.preventDefault();
    setOverlayEmailError(null);
    setOverlayEmailLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: overlayEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send email");
      setOverlayStep("otp");
    } catch (err) {
      setOverlayEmailError(err.message ?? "Failed to send email");
    } finally {
      setOverlayEmailLoading(false);
    }
  }

  // Handle overlay OTP resend
  async function handleOverlayResend() {
    setOverlayOtpError(null);
    setOverlayResendCooldown(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: overlayEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to resend code");
      setOverlayOtp("");
    } catch (err) {
      setOverlayOtpError(err.message ?? "Failed to resend code");
    } finally {
      setTimeout(() => setOverlayResendCooldown(false), 30_000);
    }
  }

  // Handle overlay OTP verification
  async function handleOverlayOtpSubmit(e) {
    e.preventDefault();
    setOverlayOtpError(null);
    setOverlayOtpLoading(true);
    try {
      const res = await fetch("/api/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: overlayEmail, code: overlayOtp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");

      setEmail(overlayEmail);
      if (data.resetToken) setToken(data.resetToken);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("mgh_reset_email", overlayEmail);
        if (data.resetToken) sessionStorage.setItem("mgh_reset_token", data.resetToken);
      }

      // Close overlay and unblur the reset password page
      setOverlayStep(null);
    } catch (err) {
      setOverlayOtpError(err.message ?? "Verification failed");
    } finally {
      setOverlayOtpLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError(null);

    const targetEmail =
      email ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("mgh_reset_email")
        : "");

    if (!targetEmail) {
      setError("Email address is missing. Please enter your email to proceed.");
      setOverlayStep("email");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password. Please try again.");
      }

      setSuccess(true);

      // Clear reset state from session storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("mgh_reset_email");
        sessionStorage.removeItem("mgh_reset_token");
      }

      // Automatically redirect back to the login page after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  const isBlurred = overlayStep !== null;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-mgh-bg">
      {/* ── Main Reset Password Page ── */}
      <main
        className={cn(
          "mgh-warm mgh-site grid min-h-dvh grid-cols-1 bg-mgh-bg text-mgh-text lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] transition-all duration-700",
          isBlurred && "filter blur-md md:blur-lg scale-[0.99] opacity-40 brightness-75 pointer-events-none select-none",
        )}
      >
        {/* Visual story banner */}
        <section
          aria-labelledby="reset-welcome"
          className="relative isolate flex min-h-[17rem] flex-col justify-between overflow-hidden px-5 pb-8 pt-6 sm:px-10 lg:min-h-dvh lg:px-14 lg:pb-14 lg:pt-10"
        >
          <Image
            src="/images/auth-bg.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="-z-10 object-cover object-[45%_62%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-linear-to-t from-mgh-bg via-mgh-bg/30 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 -z-10 hidden w-1/3 bg-linear-to-r from-transparent to-mgh-bg lg:block"
          />

          <Link
            href="/"
            aria-label="Mlangeni Grand Hospitality home"
            className={cn("w-fit rounded-control", focusRing)}
          >
            <Image
              src="/logos/logo2.png"
              alt=""
              width={1303}
              height={777}
              sizes="160px"
              className="h-12 w-auto lg:h-16"
            />
          </Link>

          <div className="max-w-xl">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-mgh-gold">
              We create
            </p>
            <h1
              id="reset-welcome"
              className="mt-3 font-serif text-[2.5rem] font-normal leading-[1.05] tracking-[-0.01em] text-mgh-text sm:text-5xl lg:text-[4rem]"
            >
              Unforgettable experiences
            </h1>
            <p className="mt-5 hidden max-w-[44ch] text-pretty text-[17px] leading-relaxed text-mgh-text/80 sm:block">
              From intimate gatherings to grand celebrations, we craft moments
              that leave a lasting impression.
            </p>

            <dl className="mt-10 hidden grid-cols-3 gap-6 border-t border-mgh-text/15 pt-6 lg:grid">
              {[
                { title: "Mlangeni Events", line: "We plan, you celebrate." },
                {
                  title: "Hospitality Collection",
                  line: "Luxury stays. Lasting comfort.",
                },
                {
                  title: "Unforgettable Moments",
                  line: "Crafted with care, remembered forever.",
                },
              ].map((item) => (
                <div key={item.title}>
                  <dt className="font-serif text-lg text-mgh-text">{item.title}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-mgh-text/70">
                    {item.line}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Form container */}
        <section
          aria-labelledby="reset-title"
          className="flex items-start justify-center px-5 pb-16 pt-10 sm:px-10 lg:items-center lg:py-16"
        >
          <div className="w-full max-w-[26rem] animate-in fade-in-0 slide-in-from-bottom-2 duration-700">
            <p className="text-sm text-mgh-muted">Account security</p>
            <h2
              id="reset-title"
              className="mt-2 font-serif text-[2rem] font-normal leading-tight text-mgh-text"
            >
              Set new password
            </h2>
            <p className="mt-2 text-sm text-mgh-muted">
              Enter your new password below to secure your account.
            </p>

            <form className="mt-8 flex flex-col gap-6" onSubmit={handleResetPassword}>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="new-password"
                  className="text-[13px] font-medium text-mgh-muted"
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || success}
                    className={cn(fieldClass, "pr-12")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className={cn(
                      "absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-control text-mgh-muted transition-colors hover:text-mgh-text",
                      focusRing,
                    )}
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="confirm-password"
                  className="text-[13px] font-medium text-mgh-muted"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your new password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading || success}
                    className={cn(fieldClass, "pr-12")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className={cn(
                      "absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-control text-mgh-muted transition-colors hover:text-mgh-text",
                      focusRing,
                    )}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error banner */}
              {error && (
                <div role="alert">
                  <p className="flex items-start gap-2.5 rounded-control border border-mgh-danger/35 bg-mgh-danger/[0.06] px-4 py-3 text-sm leading-relaxed text-mgh-text">
                    <AlertCircle
                      size={16}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-mgh-danger"
                    />
                    <span>{error}</span>
                  </p>
                </div>
              )}

              {/* Success banner */}
              {success && (
                <div role="status">
                  <p className="flex items-start gap-2.5 rounded-control border border-mgh-ok/35 bg-mgh-ok/[0.06] px-4 py-3 text-sm leading-relaxed text-mgh-text">
                    <CheckCircle2
                      size={16}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-mgh-ok"
                    />
                    <span>
                      Password updated successfully! Automatically redirecting you to
                      the sign in page…
                    </span>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || success}
                aria-busy={loading || undefined}
                className={cn(
                  "mt-1 h-12 rounded-control bg-mgh-gold text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-mgh-gold-ink",
                  "transition-[background-color,transform,opacity] duration-200 hover:bg-mgh-gold-hover active:scale-[0.98] disabled:cursor-wait disabled:opacity-60",
                  focusRing,
                )}
              >
                {loading
                  ? "Updating Password..."
                  : success
                    ? "Password Updated"
                    : "RESET PASSWORD"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-mgh-muted">
              Remembered your password?{" "}
              <Link
                href="/login"
                className={cn(
                  "rounded-sm text-mgh-text underline decoration-mgh-gold underline-offset-4 transition-colors hover:decoration-mgh-text",
                  focusRing,
                )}
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </main>

      {/* ── Overlay Modal Step 1: Email (if loaded without verified OTP) ── */}
      <Dialog
        open={overlayStep === "email"}
        onOpenChange={(open) => { if (!open) router.push("/login"); }}
        title="Forgot password"
        size="md"
        dismissible={!overlayEmailLoading}
      >
        <form onSubmit={handleOverlayEmailSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a 6-digit verification code.
          </p>

          {overlayEmailError && (
            <p className="rounded-control border border-mgh-danger/30 bg-mgh-danger/5 px-4 py-3 text-sm text-mgh-danger">
              {overlayEmailError}
            </p>
          )}

          <Field label="Email address" required>
            <Input
              type="email"
              value={overlayEmail}
              onChange={(e) => setOverlayEmail(e.target.value)}
              disabled={overlayEmailLoading}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>

          <Button type="submit" variant="primary" loading={overlayEmailLoading} className="w-full">
            {overlayEmailLoading ? "Sending…" : "Send verification code"}
          </Button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to sign in
          </button>
        </form>
      </Dialog>

      {/* ── Overlay Modal Step 2: OTP (if loaded without verified OTP) ── */}
      <Dialog
        open={overlayStep === "otp"}
        onOpenChange={(open) => { if (!open) router.push("/login"); }}
        title="Enter verification code"
        size="md"
        dismissible={!overlayOtpLoading}
      >
        <form onSubmit={handleOverlayOtpSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            A 6-digit code was sent to <strong>{overlayEmail}</strong>. It expires in 10 minutes.
          </p>

          {overlayOtpError && (
            <p className="rounded-control border border-mgh-danger/30 bg-mgh-danger/5 px-4 py-3 text-sm text-mgh-danger">
              {overlayOtpError}
            </p>
          )}

          <Field label="Verification code" required>
            <Input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={overlayOtp}
              onChange={(e) => setOverlayOtp(e.target.value.replace(/\D/g, ""))}
              disabled={overlayOtpLoading}
              placeholder="6-digit code"
              autoComplete="one-time-code"
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            loading={overlayOtpLoading}
            className="w-full"
            disabled={overlayOtp.length !== 6}
          >
            {overlayOtpLoading ? "Verifying…" : "Verify code"}
          </Button>

          <button
            type="button"
            onClick={handleOverlayResend}
            disabled={overlayResendCooldown}
            className="text-sm text-center text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {overlayResendCooldown ? "Code resent – wait 30 s before resending again" : "Didn't receive a code? Resend"}
          </button>
        </form>
      </Dialog>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-mgh-bg flex items-center justify-center p-6 text-sm text-mgh-muted">
          Loading…
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
