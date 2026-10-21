"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const EASE = [0.22, 1, 0.36, 1];

const inlineLink =
  "rounded-sm text-mgh-text underline decoration-mgh-gold decoration-1 underline-offset-[5px] transition-colors hover:decoration-mgh-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg";

function Reveal({ children, delay = 0, className, as = "p" }) {
  const Tag = motion[as];
  return (
    <Tag
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={className}
    >
      {children}
    </Tag>
  );
}

export default function About() {
  return (
    <section aria-labelledby="about-title" className="bg-mgh-bg px-5 py-24 md:px-10 md:py-36">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <Reveal
            as="h2"
            className="font-serif text-[3rem] font-normal leading-none tracking-[-0.015em] text-mgh-text sm:text-[4.5rem] lg:text-[5.5rem]"
          >
            <span id="about-title">About Us</span>
          </Reveal>

          <div className="mt-12 max-w-[60ch] space-y-7 md:mt-16">
            <Reveal className="text-pretty font-serif text-[1.375rem] leading-[1.5] text-mgh-text md:text-[1.625rem]">
              At Mlangeni Grand Hospitality, we believe every event deserves
              more than just good food. It deserves an experience.
            </Reveal>

            <Reveal delay={0.05} className="text-pretty text-[17px] leading-[1.75] text-mgh-muted">
              Based in <span className="font-medium text-mgh-text">Cape Town</span>, we
              provide catering for a range of occasions, from relaxed breakfasts
              to elegant dinners, always focusing on quality, flavour, and
              attention to detail. You can explore the{" "}
              <Link href="/dashboard/customer/menu" className={inlineLink}>
                range of dishes we offer
              </Link>{" "}
              to see how we bring each event to life.
            </Reveal>

            <Reveal delay={0.1} className="text-pretty text-[17px] leading-[1.75] text-mgh-muted">
              We’ve had the privilege of being part of many memorable
              celebrations. Take a look at{" "}
              <a href="#gallery" className={inlineLink}>
                some of the events we’ve brought to life
              </a>
              .
            </Reveal>

            <Reveal delay={0.15} className="text-pretty text-[17px] leading-[1.75] text-mgh-muted">
              Our approach is simple: understand your vision and deliver it with
              care. When you’re ready, you can{" "}
              <a href="#contact" className={inlineLink}>
                reach out to us and begin your journey
              </a>
              , and we’ll take care of the rest.
            </Reveal>
          </div>
        </div>

        <motion.figure
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.2, ease: EASE }}
          className="relative aspect-[4/5] overflow-hidden rounded-card lg:col-span-5 lg:mt-24 lg:self-start"
        >
          <Image
            src="/images/wine.jpg"
            alt="A host pouring white wine at a candlelit table"
            fill
            sizes="(min-width: 1024px) 34vw, 100vw"
            className="object-cover"
          />
        </motion.figure>

        <motion.blockquote
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="border-t border-mgh-line pt-12 lg:col-span-10 lg:col-start-2 lg:pt-16"
        >
          <span aria-hidden="true" className="mb-8 block h-px w-12 bg-mgh-gold" />
          <p className="text-balance font-serif text-[1.75rem] italic leading-[1.3] text-mgh-text md:text-[2.5rem]">
            At Mlangeni Grand Hospitality, we don’t just cater events. We create
            moments worth remembering.
          </p>
        </motion.blockquote>
      </div>
    </section>
  );
}
