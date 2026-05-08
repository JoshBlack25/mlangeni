"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function About() {
  const paragraphs = [
    `At Mlangeni Grand Hospitality, we believe every event deserves more than just good food — it deserves an experience.`,

    `Based in Cape Town, we provide catering for a range of occasions, from relaxed breakfasts to elegant dinners, always focusing on quality, flavour, and attention to detail. You can explore the range of dishes we offer to see how we bring each event to life.`,

    `We’ve had the privilege of being part of many memorable celebrations — take a look at some of the events we’ve brought to life.`,

    `Our approach is simple: understand your vision and deliver it with care. When you’re ready, you can reach out to us and begin your journey, and we’ll take care of the rest.`,

    `At Mlangeni Grand Hospitality, we don’t just cater events — we create moments worth remembering.`,
  ];

  return (
    <section className="bg-black text-white px-6 md:px-12 py-28 font-[Playfair_Display]">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto"
      >
        {/* TITLE */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center text-4xl md:text-6xl font-light mb-16 tracking-wide"
        >
          About Us
        </motion.h1>

        {/* CONTENT */}
        <div className="space-y-10 text-white/80 text-lg md:text-xl leading-relaxed">
          {paragraphs.map((text, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              {/* Special link handling */}
              {text.includes("range of dishes we offer") ? (
                <>
                  Based in <span className="text-[#D4AF37]">Cape Town</span>, we
                  provide catering for a range of occasions, from relaxed
                  breakfasts to elegant dinners, always focusing on quality,
                  flavour, and attention to detail. You can explore the{" "}
                  <Link
                    href="/bookings"
                    className="text-[#D4AF37] border-b border-[#D4AF37] hover:text-white hover:border-white transition-all duration-300"
                  >
                    range of dishes we offer
                  </Link>{" "}
                  to see how we bring each event to life.
                </>
              ) : text.includes("events we’ve brought to life") ? (
                <>
                  We’ve had the privilege of being part of many memorable
                  celebrations — take a look at{" "}
                  <Link
                    href="/gallery"
                    className="text-[#D4AF37] border-b border-[#D4AF37] hover:text-white hover:border-white transition-all duration-300"
                  >
                    some of the events we’ve brought to life
                  </Link>
                  .
                </>
              ) : text.includes("reach out to us") ? (
                <>
                  Our approach is simple: understand your vision and deliver it
                  with care. When you’re ready, you can{" "}
                  <Link
                    href="/contact"
                    className="text-[#D4AF37] border-b border-[#D4AF37] hover:text-white hover:border-white transition-all duration-300"
                  >
                    reach out to us and begin your journey
                  </Link>
                  , and we’ll take care of the rest.
                </>
              ) : (
                text
              )}
            </motion.p>
          ))}

          {/* FINAL LINE */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white font-light text-xl md:text-2xl pt-6"
          >
            At Mlangeni Grand Hospitality, we don’t just cater events — we
            create moments worth remembering.
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}