"use client";

import { useState } from "react";
import Image from "next/image";

export function FoodImage({ src, alt, className }) {
  const [errored, setErrored] = useState(false);

  if (errored || !src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#181818] text-xs text-[#666666]">
        No Image Available
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || "Menu Item"}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      className={className || "object-cover"}
      onError={() => setErrored(true)}
    />
  );
}
