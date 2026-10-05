"use client";

/**
 * The gold initials circle used wherever a person needs a face.
 *
 * There are no profile photos anywhere in this app — no column, no storage
 * bucket, no upload UI — so initials are the whole story today. The `src` prop
 * exists so that if profile photos are ever added, every call site picks them
 * up without being touched; until then it is always undefined.
 *
 * Lifted from the treatment already used on the customer profile page.
 */
export default function Monogram({
  initials,
  src,
  alt,
  size = 48,
  className = "",
}) {
  const box = { width: size, height: size };
  // Keeps the letters in proportion as callers vary the size.
  const fontSize = Math.max(11, Math.round(size * 0.36));

  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? ""}
        style={box}
        className={`shrink-0 rounded-full border border-[#D4AF37]/30 object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={{ ...box, fontSize }}
      aria-hidden={!alt}
      aria-label={alt || undefined}
      role={alt ? "img" : undefined}
      className={`flex shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 font-semibold tracking-wide text-[#D4AF37] ${className}`}
    >
      {initials || "?"}
    </div>
  );
}
