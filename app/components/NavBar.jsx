"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

// Every link goes somewhere real: a section of the homepage ("#..."), or a page
// that exists. The booking pages need an account, so signed-out visitors are
// sent to sign in first.
const NAV_COLUMNS = [
  {
    title: "Mlangeni Events",
    cta: { label: "Start Planning", href: "#contact" },
    image: "/images/events-thumbnail.png",
    links: [
      { label: "Check Availability", href: "#calendar" },
      { label: "Make an Enquiry", href: "#contact" },
      { label: "Book an Event", href: "/dashboard/customer/booking" },
      { label: "Build Your Menu", href: "/dashboard/customer/booking/menubuilder" },
      { label: "Our Menu", href: "/dashboard/customer/menu" },
    ],
  },
  {
    title: "Our Work",
    cta: { label: "View Gallery", href: "#gallery" },
    image: "/images/gallery_images/gallery-hero.png",
    links: [
      { label: "Gallery", href: "#gallery" },
      { label: "A Taste of Our Work", href: "#our-work" },
      { label: "A Night in Motion", href: "#showreel" },
    ],
  },
  {
    title: "Why Mlangeni?",
    cta: { label: "About Us", href: "#about" },
    image: "/images/gallery_images/food_6.jpg",
    links: [
      { label: "Our Story", href: "#about" },
      { label: "Testimonials", href: "#testimonials" },
    ],
  },
  {
    title: "Get in Touch",
    cta: { label: "Contact", href: "#contact" },
    image: "/images/auth-bg.png",
    links: [
      { label: "Plan an Event", href: "#contact" },
      { label: "Client Sign In", href: "/login" },
      { label: "Create an Account", href: "/register" },
    ],
  },
];

const EASE = [0.22, 1, 0.36, 1];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg";

// On the homepage, "#contact" scrolls to a section. Every other page has no
// such section, so the same link has to go back to the homepage first.
function resolveHref(href, solid) {
  return solid && href.startsWith("#") ? `/${href}` : href;
}

/**
 * `solid` is for pages without the homepage hero: the bar is opaque with its
 * logo from the start, and section links point back to the homepage.
 */
export default function Navbar({ solid = false }) {
  const [open, setOpen] = useState(false);
  const [inHero, setInHero] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);
  // A section picked from the open menu; we go there once the menu has
  // closed and released the page's scroll lock.
  const pendingHash = useRef(null);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInHero(entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const close = (hash) => {
    pendingHash.current = typeof hash === "string" && hash.startsWith("#") ? hash : null;
    setOpen(false);
    setActiveIndex(null);
  };

  const goToPendingSection = (event) => {
    const hash = pendingHash.current;
    pendingHash.current = null;
    const target = hash && document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    window.history.replaceState(null, "", hash);
    target.scrollIntoView({ block: "start" });
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  // Over the hero the bar is clear and the hero's own crest stands in for the
  // logo; once you scroll past, the bar settles onto the page with its mark.
  const overHero = !solid && inHero && !open;

  return (
    <nav aria-label="Main">
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-500 ease-mgh",
          overHero
            ? "border-transparent bg-linear-to-b from-mgh-bg/70 to-transparent"
            : "border-mgh-line bg-mgh-bg/90 backdrop-blur-md",
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 md:h-[72px] md:px-10">
          <a
            href={solid ? "/" : "#hero"}
            onClick={() => close()}
            aria-label={solid ? "Mlangeni Grand Hospitality, home" : "Mlangeni Grand Hospitality, back to top"}
            aria-hidden={overHero || undefined}
            tabIndex={overHero ? -1 : undefined}
            className={cn("rounded-control", focusRing)}
          >
            <motion.span
              className="block"
              initial={false}
              animate={{ opacity: overHero ? 0 : 1, y: overHero ? -8 : 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              style={{ pointerEvents: overHero ? "none" : "auto" }}
            >
              <Image
                src="/logos/logo2.png"
                alt=""
                width={1303}
                height={777}
                sizes="72px"
                className="h-10 w-auto md:h-11"
              />
            </motion.span>
          </a>

          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="/login"
              className={cn(
                "group relative rounded-control px-3 py-2 text-[0.72rem] font-medium uppercase tracking-[0.28em] text-mgh-text transition-colors hover:text-mgh-gold",
                focusRing,
              )}
            >
              Login
              <span
                aria-hidden="true"
                className="absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 bg-mgh-gold transition-transform duration-300 ease-mgh group-hover:scale-x-100"
              />
            </Link>

            <MenuButton open={false} onClick={() => setOpen(true)} />
          </div>
        </div>
      </header>

      <DialogPrimitive.Root open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Content
            aria-describedby={undefined}
            onCloseAutoFocus={goToPendingSection}
            className={cn(
              "mgh-warm fixed inset-0 z-[60] overflow-y-auto bg-mgh-bg text-mgh-text",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-300",
            )}
          >
            <DialogPrimitive.Title className="sr-only">Site menu</DialogPrimitive.Title>

            <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 md:h-[72px] md:px-10">
              <Image
                src="/logos/logo2.png"
                alt=""
                width={1303}
                height={777}
                sizes="72px"
                className="h-10 w-auto md:h-11"
              />
              <DialogPrimitive.Close asChild>
                <MenuButton open />
              </DialogPrimitive.Close>
            </div>

            <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-6 md:px-10 md:pt-10">
              {/* Phones: one column at a time. */}
              <div className="md:hidden">
                {NAV_COLUMNS.map((col, i) => {
                  const isOpen = activeIndex === i;
                  const panelId = `nav-col-${i}`;
                  return (
                    <div key={col.title} className="border-b border-mgh-line">
                      <h2>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() => setActiveIndex(isOpen ? null : i)}
                          className={cn(
                            "flex w-full items-center justify-between gap-4 py-5 text-left",
                            focusRing,
                          )}
                        >
                          <span className={cn("font-serif text-2xl", isOpen ? "text-mgh-text" : "text-mgh-muted")}>
                            {col.title}
                          </span>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "relative size-4 shrink-0 transition-transform duration-300 ease-mgh",
                              isOpen && "rotate-45",
                            )}
                          >
                            <span className="absolute inset-x-0 top-1/2 h-px bg-mgh-gold" />
                            <span className="absolute inset-y-0 left-1/2 w-px bg-mgh-gold" />
                          </span>
                        </button>
                      </h2>

                      <motion.div
                        id={panelId}
                        initial={false}
                        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className="overflow-hidden"
                        inert={!isOpen || undefined}
                      >
                        <ul className="space-y-1 pb-6">
                          {col.links.map((link) => (
                            <li key={link.label}>
                              <NavLink href={resolveHref(link.href, solid)} onNavigate={close}>
                                {link.label}
                              </NavLink>
                            </li>
                          ))}
                          <li className="pt-3">
                            <CtaLink href={resolveHref(col.cta.href, solid)} onNavigate={close}>
                              {col.cta.label}
                            </CtaLink>
                          </li>
                        </ul>
                      </motion.div>
                    </div>
                  );
                })}
              </div>

              {/* Larger screens: the four columns side by side. */}
              <div className="hidden gap-6 md:grid md:grid-cols-4 lg:gap-10">
                {NAV_COLUMNS.map((col, i) => (
                  <motion.section
                    key={col.title}
                    aria-labelledby={`nav-title-${i}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.07, duration: 0.6, ease: EASE }}
                    className="flex flex-col"
                  >
                    <div className="group relative mb-6 aspect-[4/5] overflow-hidden rounded-card">
                      <Image
                        src={col.image}
                        alt=""
                        fill
                        sizes="(min-width: 1440px) 320px, 25vw"
                        className="object-cover transition-transform duration-[1200ms] ease-mgh group-hover:scale-[1.04]"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-linear-to-t from-mgh-bg via-mgh-bg/40 to-transparent"
                      />
                      <div className="absolute inset-x-5 bottom-5">
                        <h2 id={`nav-title-${i}`} className="font-serif text-2xl leading-tight text-mgh-text">
                          {col.title}
                        </h2>
                        <CtaLink href={resolveHref(col.cta.href, solid)} onNavigate={close} className="mt-3">
                          {col.cta.label}
                        </CtaLink>
                      </div>
                    </div>

                    <ul className="space-y-0.5">
                      {col.links.map((link) => (
                        <li key={link.label}>
                          <NavLink href={resolveHref(link.href, solid)} onNavigate={close}>
                            {link.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </motion.section>
                ))}
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </nav>
  );
}

function MenuButton({ open, ...props }) {
  return (
    <button
      type="button"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      aria-haspopup="dialog"
      className={cn(
        "group grid size-11 place-items-center rounded-control text-mgh-text transition-colors hover:text-mgh-gold",
        focusRing,
      )}
      {...props}
    >
      <span aria-hidden="true" className="relative block h-3 w-7">
        <span
          className={cn(
            "absolute left-0 top-0 h-px w-7 bg-current transition-transform duration-300 ease-mgh",
            open && "top-1.5 rotate-45",
          )}
        />
        <span
          className={cn(
            "absolute bottom-0 right-0 h-px w-5 bg-current transition-[transform,width] duration-300 ease-mgh group-hover:w-7",
            open && "bottom-1.5 w-7 -rotate-45",
          )}
        />
      </span>
    </button>
  );
}

/** In-page links close the menu first, then travel (see goToPendingSection). */
function MenuLink({ href, onNavigate, className, children }) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} onClick={() => onNavigate()} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onNavigate(href);
      }}
      className={className}
    >
      {children}
    </a>
  );
}

function NavLink({ href, onNavigate, children }) {
  return (
    <MenuLink
      href={href}
      onNavigate={onNavigate}
      className={cn(
        "inline-block rounded-control py-1.5 text-[15px] text-mgh-muted transition-colors hover:text-mgh-text",
        focusRing,
      )}
    >
      {children}
    </MenuLink>
  );
}

function CtaLink({ href, onNavigate, className, children }) {
  return (
    <MenuLink
      href={href}
      onNavigate={onNavigate}
      className={cn(
        "inline-flex items-center rounded-control border-b border-mgh-gold pb-1 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-mgh-gold transition-colors hover:text-mgh-text",
        focusRing,
        className,
      )}
    >
      {children}
    </MenuLink>
  );
}
