"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/services/supabaseClient";

export default function RecentEnquiries() {
  const [enquiries, setEnquiries] = useState(null);

  useEffect(() => {
    async function loadEnquiries() {
      const { data, error } = await supabase
        .from("enquiries")
        .select("id, name, event_date, status")
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error("Failed to load enquiries:", error);
        setEnquiries([]);
        return;
      }

      setEnquiries(data ?? []);
    }

    loadEnquiries();
  }, []);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#1F1F1F] bg-white/5 p-5 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Recent Enquiries</h3>
        <Link
          href="/dashboard/admin/enquiries"
          className="text-xs font-medium text-[#D4AF37] hover:underline"
        >
          View all
        </Link>
      </div>

      {enquiries === null ? (
        <div className="flex flex-1 flex-col gap-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg border border-[#1F1F1F] bg-white/5"
            />
          ))}
        </div>
      ) : enquiries.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-[#A0A0A0]">
          No recent enquiries.
        </p>
      ) : (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {enquiries.map((e) => (
            <Link
              key={e.id}
              href={`/dashboard/admin/enquiries/${e.id}`}
              className="flex items-center justify-between rounded-lg border border-[#1F1F1F] bg-[#0A0A0A]/40 px-3 py-2 text-sm transition hover:border-[#D4AF37]"
            >
              <span className="text-white">{e.name}</span>
              <span className="text-[#A0A0A0] capitalize">{e.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
