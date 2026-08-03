"use client";

import { useState } from "react";

export default function SuccessModal({ isOpen, onClose, name }) {
  const [refId] = useState(
    () => `HC-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`
  );

  if (!isOpen) return null;

  const firstName = name.split(" ")[0];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap');`}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
        <div
          className="relative w-full max-w-md border border-[#2A2A2A] bg-[#0F0F0F] overflow-hidden"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {/* Watermark logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <img
              src="/assests/logos/logoPNG.png"
              alt=""
              className="w-72 opacity-[0.04] object-contain"
            />
          </div>

          {/* Decorative top line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center px-10 pt-10 pb-8 gap-5">

            {/* Check icon */}
            <div className="w-14 h-14 rounded-full border border-[#D4AF37] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Title */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-3">Enquiry Submitted!</h2>
              <p className="text-sm text-[#888] leading-relaxed">
                Thank you, {firstName}! We have received your enquiry and will be in
                touch shortly. A confirmation has been sent to your email.
              </p>
            </div>

            {/* WhatsApp notice */}
            <div className="w-full bg-[#1A2A1A] border border-[#2A3D2A] rounded-sm px-5 py-4 flex gap-3 items-start">
              <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.116 1.522 5.847L.057 23.714a.5.5 0 00.63.63l5.866-1.463A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.806 9.806 0 01-5.028-1.381l-.36-.214-3.732.931.949-3.731-.234-.374A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
              </svg>
              <p className="text-xs text-[#AAA] leading-relaxed">
                A WhatsApp message has also been opened in a new tab for us to follow up with you directly.
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-[#1E1E1E]" />

            {/* Done button */}
            <button
              onClick={onClose}
              className="w-full bg-[#D4AF37] hover:bg-[#C09B2A] text-[#0A0A0A] text-xs font-bold tracking-[0.25em] uppercase py-4 transition-colors duration-200"
            >
              Done
            </button>

            {/* Ref ID */}
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#444]">
              Ref ID: {refId}
            </p>

          </div>

          {/* Footer bar */}
          <div className="relative z-10 border-t border-[#1E1E1E] bg-[#0A0A0A] px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center overflow-hidden">
                <img
                  src="/assests/logos/logo2.png"
                  alt="Concierge"
                  className="w-full h-full object-cover opacity-70"
                />
              </div>
              <div>
                <p className="text-[9px] tracking-[0.2em] uppercase text-[#555]">Assigned Concierge</p>
                <p className="text-xs text-[#AAA] font-bold">Julian Saint-James</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] tracking-[0.2em] uppercase text-[#555]">Priority Response</p>
              <p className="text-xs text-[#AAA] font-bold">Under 24 Hours</p>
            </div>
          </div>

          {/* Decorative bottom line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        </div>
      </div>
    </>
  );
}