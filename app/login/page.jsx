"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "@/services/supabaseClient";
import { cn } from "@/lib/utils";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg";

const fieldClass =
  "h-12 w-full rounded-control border border-mgh-line-strong bg-mgh-surface px-4 text-[15px] text-mgh-text placeholder:text-mgh-dim " +
  "outline-none transition-[border-color,box-shadow] duration-200 hover:border-mgh-dim " +
  "focus-visible:border-mgh-gold focus-visible:ring-3 focus-visible:ring-mgh-gold/20 aria-invalid:border-mgh-danger/70";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");

    setLoading(false);

    if (rpcError) {
      console.error("Role check failed:", rpcError);
      setError("Something went wrong signing you in. Please try again.");
      return;
    }

    router.push(isAdmin ? "/dashboard/admin" : customerReturnPath());

  }

  // Where a signed-out customer was heading (useRoleGuard adds ?next=). Only a
  // customer dashboard path is accepted, so the parameter cannot be used to
  // send someone to another site.
  function customerReturnPath() {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && /^\/dashboard\/customer(\/[\w/-]*)?$/.test(next)
      ? next
      : "/dashboard/customer";
  }

  async function handleLoginGoogle(e){
    e.preventDefault();
    setError(null);


    const {error: signInError} = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              // redirectTo: `${window.location.origin}/dashboard/customer`,
              redirectTo: `${window.location.origin}/complete-profile`,
            },
          });

        if(signInError){
        setError(signInError.message);
      }

  }

  const [showPassword, setShowPassword] = useState(false);

   function togglePasswordVisibility(){
      setShowPassword((prev)=> !prev);
  }

  return (
    <main className="mgh-warm mgh-site grid min-h-dvh grid-cols-1 bg-mgh-bg text-mgh-text lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* The room: the same candlelit table the guest will find again inside
          their dashboard. A short band on phones, half the screen from lg. */}
      <section
        aria-labelledby="login-welcome"
        className="relative isolate flex min-h-[17rem] flex-col justify-between overflow-hidden px-5 pb-8 pt-6 sm:px-10 lg:min-h-dvh lg:px-14 lg:pb-14 lg:pt-10"
      >
        <Image
          src="/images/auth-bg.png"
          alt=""
          fill
          preload
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="-z-10 object-cover object-[45%_62%]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-mgh-bg via-mgh-bg/30 to-transparent" />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 hidden w-1/3 bg-linear-to-r from-transparent to-mgh-bg lg:block" />

        <Link href="/" aria-label="Mlangeni Grand Hospitality home" className={cn("w-fit rounded-control", focusRing)}>
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
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-mgh-gold">We create</p>
          <h1
            id="login-welcome"
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

      {/* The desk: one form, nothing competing with it. */}
      <section
        aria-labelledby="login-title"
        className="flex items-start justify-center px-5 pb-16 pt-10 sm:px-10 lg:items-center lg:py-16"
      >
        <div className="w-full max-w-[26rem] animate-in fade-in-0 slide-in-from-bottom-2 duration-700">
          <p className="text-sm text-mgh-muted">Welcome back</p>
          <h2 id="login-title" className="mt-2 font-serif text-[2rem] font-normal leading-tight text-mgh-text">
            Sign in to your account
          </h2>

          <form className="mt-10 flex flex-col gap-6" onSubmit={handleLogin}>
            <div className="flex flex-col gap-2">
              <label htmlFor="login-email" className="text-[13px] font-medium text-mgh-muted">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "login-error" : undefined}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor="login-password" className="text-[13px] font-medium text-mgh-muted">
                  Password
                </label>
                <Link
                  href="#"
                  className={cn("rounded-sm text-[13px] text-mgh-muted underline-offset-4 transition-colors hover:text-mgh-text hover:underline", focusRing)}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "login-error" : undefined}
                  className={cn(fieldClass, "pr-12")}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  aria-controls="login-password"
                  className={cn(
                    "absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-control text-mgh-muted transition-colors hover:text-mgh-text",
                    focusRing,
                  )}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-3 text-sm text-mgh-muted">
              <input type="checkbox" className="size-4 shrink-0 accent-mgh-gold [color-scheme:dark]" />
              Remember me
            </label>

            {/* Always in the page so screen readers hear the message the moment it appears. */}
            <div id="login-error" role="alert" className="empty:hidden">
              {error && (
                <p className="flex items-start gap-2.5 rounded-control border border-mgh-danger/35 bg-mgh-danger/[0.06] px-4 py-3 text-sm leading-relaxed text-mgh-text">
                  <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-mgh-danger" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading || undefined}
              className={cn(
                "mt-1 h-12 rounded-control bg-mgh-gold text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-mgh-gold-ink",
                "transition-[background-color,transform,opacity] duration-200 hover:bg-mgh-gold-hover active:scale-[0.98] disabled:cursor-wait disabled:opacity-60",
                focusRing,
              )}
            >
              {loading ? "Signing In..." : "SIGN IN"}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-mgh-line-strong" />
            <span className="text-caption uppercase tracking-[0.2em] text-mgh-dim">or</span>
            <span className="h-px flex-1 bg-mgh-line-strong" />
          </div>

          <button
            type="button"
            onClick={handleLoginGoogle}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-3 rounded-control border border-mgh-line-strong text-[15px] text-mgh-text",
              "transition-[background-color,border-color,transform] duration-200 hover:border-mgh-dim hover:bg-mgh-surface active:scale-[0.98]",
              focusRing,
            )}
          >
            <FcGoogle size={18} aria-hidden="true" />
            Continue with Google
          </button>

          <p className="mt-10 text-center text-sm text-mgh-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className={cn("rounded-sm text-mgh-text underline decoration-mgh-gold underline-offset-4 transition-colors hover:decoration-mgh-text", focusRing)}
            >
              Create account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
