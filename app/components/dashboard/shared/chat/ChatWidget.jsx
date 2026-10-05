"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import ChatPanel from "./ChatPanel";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Open support chat" className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37] bg-[#D4AF37] text-black shadow-[0_8px_30px_rgba(212,175,55,0.25)] transition hover:scale-105 hover:bg-[#c4a132]"><MessageCircle size={23} /></button>
      {open && <div className="fixed inset-0 z-[60] bg-black/80 p-0 backdrop-blur-sm sm:p-6"><div className="mx-auto flex h-full max-w-4xl items-center justify-center"><ChatPanel fullScreen onClose={() => setOpen(false)} /></div></div>}
    </>
  );
}