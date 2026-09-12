"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Requires a positioned parent — it fills it. */
export function FoodImage({ src, alt, className }) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (errored || !src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-mgh-surface-3 text-xs text-mgh-faint">
        <ImageOff size={20} aria-hidden="true" />
        No image available
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse bg-mgh-surface-3"
          aria-hidden="true"
        />
      )}
      <Image
        src={src}
        alt={alt || "Menu item"}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className={cn(
          "transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          className || "object-cover",
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </>
  );
}
