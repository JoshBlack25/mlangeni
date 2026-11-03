'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { Dialog, Button, Field, Input } from '@/app/components/dashboard/ui';
import { cn } from '@/lib/utils';

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg";

const fieldClass =
  "h-12 w-full rounded-control border border-mgh-line-strong bg-mgh-surface px-4 text-[15px] text-mgh-text placeholder:text-mgh-dim " +
  "outline-none transition-[border-color,box-shadow] duration-200 hover:border-mgh-dim " +
  "focus-visible:border-mgh-gold focus-visible:ring-3 focus-visible:ring-mgh-gold/20 aria-invalid:border-mgh-danger/70";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step 1 – email entry
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Step 2 – OTP entry
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);

  // Modal visibility
  const [showEmailModal, setShowEmailModal] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(false);

  // -------------------------------------------------------------------
  // Step 1 – request OTP email via /api/forgot-password
  // -------------------------------------------------------------------
  async function handleEmailSubmit(e) {
    e.preventDefault();
    setEmailError(null);
    setEmailLoading(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send email');
      setEmailSent(true);
      setShowEmailModal(false);
      setShowOtpModal(true);
    } catch (err) {
      setEmailError(err.message ?? 'Failed to send email');
    } finally {
      setEmailLoading(false);
    }
  }

  // -------------------------------------------------------------------
  // Resend OTP (same endpoint, resets cooldown)
  // -------------------------------------------------------------------
  async function handleResend() {
    setOtpError(null);
    setResendCooldown(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to resend code');
      setOtp('');
    } catch (err) {
      setOtpError(err.message ?? 'Failed to resend code');
    } finally {
      setTimeout(() => setResendCooldown(false), 30_000);
    }
  }

  // -------------------------------------------------------------------
  // Step 2 – verify OTP via /api/forgot-password/verify
  // -------------------------------------------------------------------
  async function handleOtpSubmit(e) {
    e.preventDefault();
    setOtpError(null);
    setOtpLoading(true);
    try {
      const res = await fetch('/api/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Verification failed');
      setOtpSuccess(true);

      // Persist verified session info so /reset-password can read it
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('mgh_reset_email', email);
        if (data.resetToken) {
          sessionStorage.setItem('mgh_reset_token', data.resetToken);
        }
      }

      const params = new URLSearchParams();
      params.set('email', email);
      if (data.resetToken) params.set('token', data.resetToken);

      // Brief success pause then transition to the active reset-password page
      setTimeout(() => router.push(`/reset-password?${params.toString()}`), 1200);
    } catch (err) {
      setOtpError(err.message ?? 'Verification failed');
    } finally {
      setOtpLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-mgh-bg">
      {/* ── Blurred Background: The Reset Password Page ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none filter blur-md md:blur-lg scale-[0.99] opacity-40 brightness-75 transition-all duration-700"
      >
        <main className="mgh-warm mgh-site grid min-h-dvh grid-cols-1 bg-mgh-bg text-mgh-text lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* Visual story banner */}
          <section className="relative isolate flex min-h-[17rem] flex-col justify-between overflow-hidden px-5 pb-8 pt-6 sm:px-10 lg:min-h-dvh lg:px-14 lg:pb-14 lg:pt-10">
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

            <div className="w-fit rounded-control">
              <Image
                src="/logos/logo2.png"
                alt=""
                width={1303}
                height={777}
                sizes="160px"
                className="h-12 w-auto lg:h-16"
              />
            </div>

            <div className="max-w-xl">
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-mgh-gold">
                We create
              </p>
              <h1 className="mt-3 font-serif text-[2.5rem] font-normal leading-[1.05] tracking-[-0.01em] text-mgh-text sm:text-5xl lg:text-[4rem]">
                Unforgettable experiences
              </h1>
              <p className="mt-5 hidden max-w-[44ch] text-pretty text-[17px] leading-relaxed text-mgh-text/80 sm:block">
                From intimate gatherings to grand celebrations, we craft moments that leave a lasting impression.
              </p>

              <dl className="mt-10 hidden grid-cols-3 gap-6 border-t border-mgh-text/15 pt-6 lg:grid">
                {[
                  { title: "Mlangeni Events", line: "We plan, you celebrate." },
                  { title: "Hospitality Collection", line: "Luxury stays. Lasting comfort." },
                  { title: "Unforgettable Moments", line: "Crafted with care, remembered forever." },
                ].map((item) => (
                  <div key={item.title}>
                    <dt className="font-serif text-lg text-mgh-text">{item.title}</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-mgh-text/70">{item.line}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* Reset password form mock */}
          <section className="flex items-start justify-center px-5 pb-16 pt-10 sm:px-10 lg:items-center lg:py-16">
            <div className="w-full max-w-[26rem]">
              <p className="text-sm text-mgh-muted">Account security</p>
              <h2 className="mt-2 font-serif text-[2rem] font-normal leading-tight text-mgh-text">
                Set new password
              </h2>
              <p className="mt-2 text-sm text-mgh-muted">
                Enter your new password below to secure your account.
              </p>

              <div className="mt-8 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-medium text-mgh-muted">New password</span>
                  <div className="relative">
                    <div className={cn(fieldClass, "flex items-center text-mgh-dim pr-12")}>
                      ••••••••••••
                    </div>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-mgh-dim">
                      <Eye size={18} />
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-medium text-mgh-muted">Confirm new password</span>
                  <div className="relative">
                    <div className={cn(fieldClass, "flex items-center text-mgh-dim pr-12")}>
                      ••••••••••••
                    </div>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-mgh-dim">
                      <Eye size={18} />
                    </span>
                  </div>
                </div>

                <div className="mt-1 h-12 rounded-control bg-mgh-gold text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-mgh-gold-ink flex items-center justify-center">
                  RESET PASSWORD
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ── Step 1: Email modal overlay ── */}
      <Dialog
        open={showEmailModal}
        onOpenChange={(open) => { if (!open) router.push('/login'); }}
        title="Forgot password"
        size="md"
        dismissible={!emailLoading}
      >
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a 6-digit verification code.
          </p>

          {emailError && (
            <p className="rounded-control border border-mgh-danger/30 bg-mgh-danger/5 px-4 py-3 text-sm text-mgh-danger">
              {emailError}
            </p>
          )}

          <Field label="Email address" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={emailLoading}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>

          <Button type="submit" variant="primary" loading={emailLoading} className="w-full">
            {emailLoading ? 'Sending…' : 'Send verification code'}
          </Button>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to sign in
          </button>
        </form>
      </Dialog>

      {/* ── Step 2: OTP modal overlay ── */}
      <Dialog
        open={showOtpModal}
        onOpenChange={(open) => { if (!open) setShowOtpModal(false); }}
        title="Enter verification code"
        size="md"
        dismissible={!otpLoading && !otpSuccess}
      >
        <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            A 6-digit code was sent to <strong>{email}</strong>. It expires in 10 minutes.
          </p>

          {otpError && (
            <p className="rounded-control border border-mgh-danger/30 bg-mgh-danger/5 px-4 py-3 text-sm text-mgh-danger">
              {otpError}
            </p>
          )}

          {otpSuccess && (
            <p className="rounded-control border border-mgh-success/30 bg-mgh-success/5 px-4 py-3 text-sm text-mgh-success">
              Verification successful – redirecting to set your new password…
            </p>
          )}

          <Field label="Verification code" required>
            <Input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={otpLoading || otpSuccess}
              placeholder="6-digit code"
              autoComplete="one-time-code"
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            loading={otpLoading}
            className="w-full"
            disabled={otpSuccess || otp.length !== 6}
          >
            {otpLoading ? 'Verifying…' : 'Verify code'}
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown || otpSuccess}
            className="text-sm text-center text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {resendCooldown ? 'Code resent – wait 30 s before resending again' : "Didn't receive a code? Resend"}
          </button>
        </form>
      </Dialog>
    </div>
  );
}
