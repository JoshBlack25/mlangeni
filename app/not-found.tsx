import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page doesn't exist. Find your way back to Mlangeni Grand Hospitality.",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg";

const ELSEWHERE = [
  { href: "/#gallery", label: "See past events" },
  { href: "/#about", label: "About us" },
  { href: "/login", label: "Client sign in" },
];

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-mgh-bg px-5 py-24 text-center md:px-10">
      <Link href="/" aria-label="Mlangeni Grand Hospitality, home" className={`rounded-control ${focusRing}`}>
        <Image src="/logos/logo2.png" alt="" width={1303} height={777} sizes="180px" className="h-auto w-[180px]" />
      </Link>

      <p className="mt-14 text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-mgh-gold">
        Error 404
      </p>
      <h1 className="mt-4 max-w-2xl text-balance font-serif text-[2.5rem] font-normal leading-[1.1] text-mgh-text sm:text-5xl">
        This table isn&rsquo;t set
      </h1>
      <p className="mx-auto mt-6 max-w-md text-pretty text-base leading-relaxed text-mgh-muted">
        The page you followed has moved or never existed. Everything you need is
        a step away.
      </p>

      <div className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
        <Link
          href="/"
          className={`inline-flex h-12 w-full items-center justify-center rounded-control bg-mgh-gold px-8 text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-mgh-gold-ink transition-[background-color,transform] duration-200 hover:bg-mgh-gold-hover active:scale-[0.98] sm:w-auto ${focusRing}`}
        >
          Back to home
        </Link>
        <Link
          href="/#contact"
          className={`inline-flex h-12 w-full items-center justify-center rounded-control border border-mgh-line-strong px-8 text-[0.75rem] font-medium uppercase tracking-[0.22em] text-mgh-text transition-colors hover:border-mgh-gold sm:w-auto ${focusRing}`}
        >
          Plan an event
        </Link>
      </div>

      <nav aria-label="Elsewhere on the site" className="mt-12">
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm">
          {ELSEWHERE.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`rounded-sm text-mgh-muted underline-offset-4 transition-colors hover:text-mgh-gold hover:underline ${focusRing}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
