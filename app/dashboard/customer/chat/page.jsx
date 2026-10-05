"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ChatPanel from "@/app/components/dashboard/shared/chat/ChatPanel";

export default function CustomerChatPage() {
  const router = useRouter();

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#0A0A0A] px-4 py-6 text-white md:px-10 md:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex w-fit items-center gap-2 text-sm text-[#A0A0A0] transition hover:text-[#D4AF37]"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
            Mlangeni support
          </p>
          <h1 className="mt-2 font-serif text-3xl text-white">Your conversation</h1>
        </div>
        <div className="h-[calc(100vh-255px)] min-h-[520px]">
          <ChatPanel fullScreen />
        </div>
      </div>
    </main>
  );
}