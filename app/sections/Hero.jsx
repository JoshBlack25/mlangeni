"use client";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";

const GOLD = "#e8c085";
const GOLD_DARK = "#ae8b55";
const SURFACE = "#131313";
const TEAL = "#98d2c3";

const SERVICES = [
  "Weddings",
  "Corporate Events",
  "Private Parties",
  "Galas & Functions",
  "Intimate Dinners",
];

const STATS = [
  { value: "500+", label: "Events Curated" },
  { value: "6+", label: "Years of Excellence" },
  { value: "100%", label: "Client Satisfaction" },
];

const BG_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e8c085' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

export default function Hero() {
  const containerRef = useRef(null);
  const headlineRef = useRef(null);
  const [activeService, setActiveService] = useState(0);

  const { scrollY } = useScroll();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % SERVICES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!headlineRef.current) return;

    const chars = headlineRef.current.querySelectorAll(".char");

    // Wait until DOM fully paints
    requestAnimationFrame(() => {
      chars.forEach((char, i) => {
        char.style.transition = `opacity 0.6s ease ${i * 0.04}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s`;
        char.style.opacity = "1";
        char.style.transform = "translateY(0)";
      });
    });
  }, []);

  const headline = "Where Every Occasion Becomes Legend";
  const words = headline.split(" ");

  return (
    <div
      ref={containerRef}
      style={{
        fontFamily: "'Manrope', sans-serif",
        background: SURFACE,
        minHeight: "100vh",
        color: "#f0e8d8",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Manrope:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .char { opacity: 0; transform: translateY(24px); display: inline-block; }
        .gold-text { background: linear-gradient(135deg, #f2d07a 0%, ${GOLD} 40%, ${GOLD_DARK} 70%, #c9a45e 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .cta-btn { background: linear-gradient(45deg, ${GOLD} 0%, ${GOLD_DARK} 100%); color: #432c00; border: none; cursor: pointer; font-family: 'Manrope', sans-serif; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; font-size: 0.75rem; border-radius: 2px; padding: 1rem 2.5rem; position: relative; overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .cta-btn::after { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.5s ease; }
        .cta-btn:hover::after { left: 100%; }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(232, 192, 133, 0.25); }
        .ghost-btn { background: transparent; color: ${GOLD}; border: 1px solid rgba(232,192,133,0.3); cursor: pointer; font-family: 'Manrope', sans-serif; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; font-size: 0.75rem; border-radius: 2px; padding: 1rem 2.5rem; transition: all 0.3s ease; }
        .ghost-btn:hover { border-color: rgba(232,192,133,0.7); background: rgba(232,192,133,0.05); }
        .nav-link { color: rgba(240,232,216,0.7); text-decoration: none; font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500; transition: color 0.3s ease; cursor: pointer; }
        .nav-link:hover { color: ${GOLD}; }
        .stat-num { font-family: 'Noto Serif', serif; font-size: 2rem; font-weight: 300; }
        .ornament-line { width: 60px; height: 1px; background: linear-gradient(90deg, transparent, ${GOLD}, transparent); }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .shimmer-gold { background: linear-gradient(90deg, ${GOLD_DARK} 25%, #f5dfa0 50%, ${GOLD_DARK} 75%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 4s linear infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .floating { animation: float 6s ease-in-out infinite; }
        .spin-slow { animation: spin-slow 30s linear infinite; }
      `}</style>

      {/* Google Fonts preload */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

      {/* Ambient background orbs */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(232,192,133,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "-15%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(152,210,195,0.04) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: BG_PATTERN,
          }}
        />
      </div>

      {/* HERO */}
      <motion.div className="hero-bg">
        {/* Full bleed image placeholder with gradient overlay */}
        <div
          style={{
            position: "relative",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Image layer - elegant food/event scene */}
          <motion.div
            style={{
              opacity: 1,
              position: "absolute",
              inset: 0,
              backgroundImage:
                // other images to consider:
                //         url('https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop')
                // url('https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop')
                // url('https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop')
                `
      linear-gradient(135deg, rgba(19,19,19,0.85) 0%, rgba(19,19,19,0.5) 50%, rgba(19,19,19,0.8) 100%),
      url('https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop')
      
    `,
              backgroundSize: "cover",
              backgroundPosition: "center",
              zIndex: 1,
            }}
          />

          {/* Decorative side accent */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "20%",
              bottom: "20%",
              width: "3px",
              background: `linear-gradient(to bottom, transparent, ${GOLD}, transparent)`,
              opacity: 0.4,
              zIndex: 2,
            }}
          />

          {/* MAIN CONTENT */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              padding: "10rem 4rem 4rem",
              maxWidth: "1400px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 420px",
                gap: "6rem",
                alignItems: "center",
              }}
            >
              {/* LEFT COLUMN */}
              <div>
                {/* Label */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "2rem",
                  }}
                >
                  <div className="ornament-line" />
                  <span
                    style={{
                      fontSize: "0.7rem",
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      color: TEAL,
                      fontWeight: 500,
                    }}
                  >
                    Luxury Catering & Events
                  </span>
                  <div className="ornament-line" />
                </motion.div>

                {/* Main headline */}
                <h1
                  ref={headlineRef}
                  style={{
                    fontFamily: "'Noto Serif', serif",
                    fontSize: "clamp(2.8rem, 5.5vw, 4.5rem)",
                    fontWeight: 300,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    marginBottom: "2rem",
                    color: "#f0e8d8",
                  }}
                >
                  {words.map((word, wi) => (
                    <span
                      key={wi}
                      style={{ display: "inline-block", marginRight: "0.3em" }}
                    >
                      {word.split("").map((char, ci) => (
                        <span
                          key={ci}
                          className="char"
                          style={{
                            transitionDelay: `${(wi * 4 + ci) * 0.035}s`,
                            color: word === "Legend" ? undefined : "#f0e8d8",
                          }}
                        >
                          {word === "Legend" ? (
                            <span className="gold-text">{char}</span>
                          ) : (
                            char
                          )}
                        </span>
                      ))}
                    </span>
                  ))}
                </h1>

                {/* Rotating service tags */}
                <div
                  style={{
                    marginBottom: "2rem",
                    height: "2rem",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeService}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.7rem",
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: GOLD,
                          fontWeight: 600,
                        }}
                      >
                        ✦
                      </span>
                      <span
                        style={{
                          fontFamily: "'Noto Serif', serif",
                          fontSize: "1.15rem",
                          fontStyle: "italic",
                          color: "rgba(240,232,216,0.6)",
                          fontWeight: 300,
                        }}
                      >
                        {SERVICES[activeService]}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.0 }}
                  style={{
                    fontSize: "1rem",
                    lineHeight: 1.8,
                    color: "rgba(240,232,216,0.55)",
                    maxWidth: "500px",
                    marginBottom: "3rem",
                    fontWeight: 300,
                  }}
                >
                  From intimate gatherings to grand celebrations, we craft
                  unforgettable culinary experiences with meticulous attention
                  to detail, exceptional service, and flavours that linger long
                  after the evening ends.
                </motion.p>

                {/* CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                  style={{
                    display: "flex",
                    gap: "1.25rem",
                    alignItems: "center",
                  }}
                >
                  <button className="cta-btn">Plan Your Event</button>
                  <button className="ghost-btn">View Our Menu</button>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.5 }}
                  style={{
                    display: "flex",
                    gap: "3rem",
                    marginTop: "4rem",
                    paddingTop: "2.5rem",
                    borderTop: "1px solid rgba(232,192,133,0.1)",
                  }}
                >
                  {STATS.map((stat, i) => (
                    <div key={i}>
                      <div className="stat-num shimmer-gold">{stat.value}</div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "rgba(240,232,216,0.4)",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          marginTop: "0.25rem",
                        }}
                      >
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* RIGHT COLUMN — Editorial card stack */}
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 1.2,
                  delay: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ position: "relative" }}
              >
                {/* Background decorative card */}
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "-12px",
                    width: "100%",
                    height: "100%",
                    border: `1px solid rgba(232,192,133,0.15)`,
                    borderRadius: "2px 16px 2px 2px",
                    background: "rgba(232,192,133,0.03)",
                    zIndex: 0,
                  }}
                />

                {/* Main feature card */}
                <div
                  className="floating"
                  style={{
                    position: "relative",
                    zIndex: 1,
                    background:
                      "linear-gradient(145deg, rgba(35,30,25,0.9) 0%, rgba(25,22,18,0.95) 100%)",
                    border: "1px solid rgba(232,192,133,0.18)",
                    borderRadius: "2px 16px 2px 2px",
                    padding: "2.5rem",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {/* Card top ornament */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
                      <line
                        x1="0"
                        y1="12"
                        x2="28"
                        y2="12"
                        stroke={GOLD}
                        strokeWidth="0.5"
                        strokeOpacity="0.5"
                      />
                      <path
                        d="M40 4 L44 12 L40 20 L36 12 Z"
                        fill={GOLD}
                        fillOpacity="0.6"
                      />
                      <line
                        x1="52"
                        y1="12"
                        x2="80"
                        y2="12"
                        stroke={GOLD}
                        strokeWidth="0.5"
                        strokeOpacity="0.5"
                      />
                    </svg>
                  </div>

                  <div
                    style={{
                      fontFamily: "'Noto Serif', serif",
                      fontSize: "0.65rem",
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      color: GOLD,
                      textAlign: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Signature Experience
                  </div>

                  <h3
                    style={{
                      fontFamily: "'Noto Serif', serif",
                      fontSize: "1.5rem",
                      fontWeight: 400,
                      textAlign: "center",
                      color: "#f0e8d8",
                      marginBottom: "0.5rem",
                      lineHeight: 1.3,
                    }}
                  >
                    The Grand Table
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Noto Serif', serif",
                      fontStyle: "italic",
                      textAlign: "center",
                      fontSize: "0.85rem",
                      color: TEAL,
                      marginBottom: "1.5rem",
                    }}
                  >
                    Our signature multi-course dining experience
                  </p>

                  <div
                    style={{
                      height: "1px",
                      background: `linear-gradient(90deg, transparent, rgba(232,192,133,0.3), transparent)`,
                      marginBottom: "1.5rem",
                    }}
                  />

                  {/* Feature list */}
                  {[
                    "Bespoke menu consultation",
                    "Silver service staff",
                    "Floral & table design",
                    "Full venue coordination",
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "0.85rem",
                      }}
                    >
                      <div
                        style={{
                          width: "5px",
                          height: "5px",
                          background: GOLD,
                          borderRadius: "50%",
                          flexShrink: 0,
                          opacity: 0.7,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "rgba(240,232,216,0.65)",
                          fontWeight: 300,
                        }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}

                  <div style={{ marginTop: "2rem" }}>
                    <button
                      className="cta-btn"
                      style={{
                        width: "100%",
                        textAlign: "center",
                        padding: "1rem",
                      }}
                    >
                      Request a Proposal
                    </button>
                  </div>

                  {/* Bottom badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      marginTop: "1.25rem",
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#4caf50",
                        opacity: 0.8,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "rgba(240,232,216,0.35)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Booking for events are open
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* EVENT TYPES STRIP */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: "relative",
          zIndex: 3,
          marginTop: "-80px",
          background: "rgba(20,17,14,0.97)",
          borderTop: "1px solid rgba(232,192,133,0.1)",
          borderBottom: "1px solid rgba(232,192,133,0.1)",
          padding: "1.5rem 4rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0",
        }}
      >
        {[
          { icon: "◈", label: "Weddings" },
          { icon: "◈", label: "Corporate" },
          { icon: "◈", label: "Private Parties" },
          { icon: "◈", label: "Galas" },
          { icon: "◈", label: "Intimate Dinners" },
          { icon: "◈", label: "Cocktail Events" },
        ].map((item, i, arr) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                padding: "0 2.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.4rem",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "0.5rem", color: GOLD, opacity: 0.6 }}>
                {item.icon}
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(240,232,216,0.5)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  transition: "color 0.3s",
                }}
                onMouseEnter={(e) => (e.target.style.color = GOLD)}
                onMouseLeave={(e) =>
                  (e.target.style.color = "rgba(240,232,216,0.5)")
                }
              >
                {item.label}
              </span>
            </div>
            {i < arr.length - 1 && (
              <div
                style={{
                  width: "1px",
                  height: "28px",
                  background: "rgba(232,192,133,0.12)",
                }}
              />
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
