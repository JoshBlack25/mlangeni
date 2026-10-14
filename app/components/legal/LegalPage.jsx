import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE, SITE_URL } from "@/lib/site";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg";

export const LEGAL_DOCUMENTS = [
  { href: "/privacy-policy", title: "Privacy Policy" },
  { href: "/terms", title: "Terms & Conditions" },
  { href: "/popia", title: "POPIA Compliance" },
  { href: "/paia-manual", title: "PAIA Manual" },
];

export const LEGAL_UPDATED = "6 October 2026";

const textLink = cn(
  "rounded-sm text-mgh-text underline decoration-mgh-line-strong underline-offset-4 transition-colors hover:decoration-mgh-gold",
  focusRing,
);

/** An email link styled for running text. */
export function Email({ address = SITE.legalEmail }) {
  return (
    <a href={`mailto:${address}`} className={textLink}>
      {address}
    </a>
  );
}

/** An internal link styled for running text. */
export function TextLink({ href, children }) {
  return (
    <Link href={href} className={textLink}>
      {children}
    </Link>
  );
}

/** One numbered section; its id is what the contents list links to. */
export function LegalSection({ id, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28">
      <h2 id={`${id}-title`} className="font-serif text-2xl font-normal leading-tight text-mgh-text md:text-[1.75rem]">
        {title}
      </h2>
      <div className="mt-5 space-y-4 text-pretty text-base leading-relaxed text-mgh-muted [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-mgh-text [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:marker:text-mgh-gold">
        {children}
      </div>
    </section>
  );
}

/**
 * The frame every legal document shares: breadcrumbs (with BreadcrumbList
 * structured data), the title, a contents list, the body, and links across to
 * the other documents.
 */
export default function LegalPage({ path, title, lead, sections, children }) {
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: title, item: `${SITE_URL}${path}` },
    ],
  };
  const others = LEGAL_DOCUMENTS.filter((d) => d.href !== path);

  return (
    <main className="bg-mgh-bg px-5 pb-24 pt-32 md:px-10 md:pb-32 md:pt-40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }}
      />

      <div className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-mgh-dim">
            <li>
              <Link href="/" className={cn("rounded-sm transition-colors hover:text-mgh-text", focusRing)}>
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-mgh-muted">
              {title}
            </li>
          </ol>
        </nav>

        <header className="mt-10 border-b border-mgh-line pb-10">
          <h1 className="text-balance font-serif text-[2.5rem] font-normal leading-[1.1] text-mgh-text sm:text-5xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-mgh-muted md:text-lg">{lead}</p>
          <p className="mt-6 text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-mgh-gold">
            Last updated {LEGAL_UPDATED}
          </p>
        </header>

        <nav aria-labelledby="contents-title" className="mt-10 rounded-card border border-mgh-line bg-mgh-surface p-6 md:p-8">
          <h2 id="contents-title" className="text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-mgh-muted">
            Contents
          </h2>
          <ol className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.id} className="flex gap-3">
                <span className="w-5 shrink-0 tabular-nums text-mgh-dim">{i + 1}.</span>
                <a href={`#${s.id}`} className={cn("rounded-sm text-mgh-muted transition-colors hover:text-mgh-text", focusRing)}>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-14 space-y-14">{children}</div>

        <aside aria-labelledby="related-title" className="mt-20 border-t border-mgh-line pt-10">
          <h2 id="related-title" className="font-serif text-xl font-normal text-mgh-text">
            Related documents
          </h2>
          <ul className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8">
            {others.map((d) => (
              <li key={d.href}>
                <Link href={d.href} className={cn("rounded-sm text-sm text-mgh-muted transition-colors hover:text-mgh-gold", focusRing)}>
                  {d.title} →
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
