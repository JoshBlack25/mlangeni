import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { focusRing } from "../ui";

/** Logo + "Mlangeni Group Holdings" wordmark, linking home. */
export default function BrandMark({ href, compact = false, caption, className }) {
  return (
    <Link href={href} className={cn("flex items-center gap-3 rounded-control", focusRing, className)}>
      <Image src="/logos/logoPNG.png" alt="" width={36} height={36} className="size-9 object-contain" preload />
      <span className={cn("flex flex-col leading-none", compact && "sr-only")}>
        <span className="font-serif text-lg text-mgh-text">Mlangeni</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-mgh-dim">
          {caption ?? "Group Holdings"}
        </span>
      </span>
    </Link>
  );
}
