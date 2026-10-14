"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FaInstagram, FaLinkedin, FaFacebook } from "react-icons/fa";
import { cn } from "@/lib/utils";
import Awards from "./Awards";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg";

// Only places that exist. "/#section" rather than "#section" so the footer
// also works on the legal pages; on the homepage the browser treats it as a
// plain in-page jump.
const LINKS = [
  { label: "About Us", href: "/#about" },
  { label: "Event Calendar", href: "/#calendar" },
  { label: "Our Gallery", href: "/#gallery" },
  { label: "Testimonials", href: "/#testimonials" },
  { label: "Get in Touch", href: "/#contact" },
  { label: "Client Sign In", href: "/login" },
  { label: "Create an Account", href: "/register" },
];

const LEGAL = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "POPIA Compliance", href: "/popia" },
  { label: "PAIA Manual", href: "/paia-manual" },
];

// Fill in each profile URL. An icon only renders once it has somewhere real to
// go — a "#" link that opens this same page in a new tab looks broken.
const SOCIALS = [
  { icon: FaInstagram, label: "Instagram", href: "" },
  { icon: FaLinkedin, label: "LinkedIn", href: "" },
  { icon: FaFacebook, label: "Facebook", href: "" },
].filter((s) => s.href);

export default function Footer() {
  const [email, setEmail] = useState("");

  return (
    <>
      <Awards />
      <footer className="bg-mgh-bg px-5 pb-10 pt-20 md:px-10 md:pt-28">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-14 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-3">
            <Image
              src="/logos/logoPNG.png"
              alt="Mlangeni Grand Hospitality"
              width={1600}
              height={1600}
              sizes="160px"
              className="-ml-3 size-36 object-contain md:size-40"
            />
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 md:col-span-4">
            <ul className="space-y-1">
              {LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={cn(
                      "inline-block rounded-sm py-1 text-sm text-mgh-muted transition-colors hover:text-mgh-text",
                      focusRing,
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <ul className="space-y-1">
              {LEGAL.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "inline-block rounded-sm py-1 text-sm text-mgh-muted transition-colors hover:text-mgh-text",
                      focusRing,
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-5">
            <h2 id="newsletter-title" className="font-serif text-2xl text-mgh-text">
              Sign up to our newsletter
            </h2>

            <form
              aria-labelledby="newsletter-title"
              onSubmit={(e) => e.preventDefault()}
              className="mt-6"
            >
              <label htmlFor="newsletter-email" className="text-[13px] font-medium text-mgh-muted">
                Email address
              </label>
              <div className="mt-2 flex border-b border-mgh-line-strong transition-[border-color,box-shadow] duration-200 focus-within:border-mgh-gold focus-within:shadow-[0_1px_0_0_var(--mgh-gold)]">
                <input
                  id="newsletter-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Your email"
                  className="w-full bg-transparent py-3 text-[15px] text-mgh-text outline-none placeholder:text-mgh-dim"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  type="submit"
                  aria-label="Sign up"
                  className={cn(
                    "grid w-12 shrink-0 place-items-center text-mgh-gold transition-colors hover:text-mgh-text",
                    focusRing,
                  )}
                >
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="mt-5 flex items-start gap-3">
                <input
                  id="newsletter-consent"
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-mgh-gold"
                />
                <label htmlFor="newsletter-consent" className="text-sm leading-relaxed text-mgh-muted">
                  I agree to receive marketing communication in line with POPIA
                  regulations.
                </label>
              </div>
            </form>

            <p className="mt-4 text-caption text-mgh-dim">
              Your data is handled securely and in accordance with South African
              privacy laws.
            </p>

            <address className="mt-10 space-y-1 text-sm not-italic">
              <a
                href="mailto:hello@mlangeni.co.za"
                className={cn("rounded-sm text-mgh-text transition-colors hover:text-mgh-gold", focusRing)}
              >
                hello@mlangeni.co.za
              </a>
              <p className="text-mgh-muted">Cape Town, South Africa</p>
            </address>

            {SOCIALS.length > 0 && (
              <ul className="mt-6 flex gap-2">
                {SOCIALS.map(({ icon: Icon, label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className={cn(
                        "grid size-10 place-items-center rounded-full border border-mgh-line-strong text-mgh-muted transition-colors hover:border-mgh-gold hover:text-mgh-text",
                        focusRing,
                      )}
                    >
                      <Icon size={16} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mx-auto mt-20 flex max-w-[1280px] flex-col justify-between gap-2 border-t border-mgh-line pt-6 text-sm text-mgh-dim md:flex-row">
          <p>Mlangeni Grand Hospitality · Cape Town, South Africa</p>
          <p>Site by CPUT</p>
        </div>
      </footer>
    </>
  );
}
