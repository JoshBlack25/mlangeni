"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";

import NotificationBell from "../header/NotificationBell";
import ProfileMenu from "../header/ProfileMenu";

export default function Header({
  title = "Customer Dashboard",
  navbar: NavComponent,
  basePath = "/dashboard/customer",
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 h-20 border-b border-[#1F1F1F] bg-[#0A0A0A]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1700px] items-center justify-between px-8">
          {/* LEFT */}

          <div className="flex items-center gap-5">
            <Image
              src="/logos/logoPNG.png"
              alt="Mlangeni"
              width={60}
              height={60}
              className="object-contain"
            />

            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#A0A0A0]">
                Mlangeni Grand Hospitality
              </p>

              <h1 className="text-lg font-semibold text-white">{title}</h1>
            </div>
          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-6">
            <NotificationBell basePath={basePath} />

            <ProfileMenu />

            <div className="h-8 w-px bg-[#1F1F1F]" />

            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg border border-[#1F1F1F] p-2 transition hover:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]"
              aria-label="Toggle navigation"
            >
              {open ? (
                <X size={24} className="text-[#D4AF37]" />
              ) : (
                <Menu size={24} className="text-[#D4AF37]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {NavComponent && (
        <NavComponent isOpen={open} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
