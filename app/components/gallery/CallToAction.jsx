import Link from "next/link";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg";

/** The gallery's closing invitation: to enquire, or to look at the menus. */
function CallToAction() {
  return (
    <section aria-labelledby="masterpiece-title" className="bg-mgh-bg px-5 py-24 md:px-10 md:py-36">
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="masterpiece-title"
          className="text-balance font-serif text-[2.5rem] font-normal leading-[1.1] text-mgh-text sm:text-5xl md:text-[4rem]"
        >
          Host Your Own Masterpiece
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-mgh-muted md:text-lg">
          Inquire today to begin curating an unforgettable culinary experience
          for your next premier event.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href="#contact"
            className={`inline-flex h-12 w-full items-center justify-center rounded-control bg-mgh-gold px-8 text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-mgh-gold-ink transition-[background-color,transform] duration-200 hover:bg-mgh-gold-hover active:scale-[0.98] sm:w-auto ${focusRing}`}
          >
            Commission an Event
          </a>
          <Link
            href="/dashboard/customer/menu"
            className={`inline-flex h-12 w-full items-center justify-center rounded-control border border-mgh-line-strong px-8 text-[0.75rem] font-medium uppercase tracking-[0.22em] text-mgh-text transition-colors hover:border-mgh-gold sm:w-auto ${focusRing}`}
          >
            Look at Our Menu
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CallToAction;
