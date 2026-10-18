"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/app/components/dashboard/ui";
import HomeSection, { rowLink } from "../HomeSection";
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
    <HomeSection
      title="Recent Enquiries"
      href="/dashboard/admin/enquiries"
      items={enquiries}
      loadingLabel="Loading enquiries…"
      emptyText="No recent enquiries."
    >
      <ul className="divide-y divide-mgh-line-soft">
        {enquiries?.map((e) => (
          <li key={e.id}>
            <Link href={`/dashboard/admin/enquiries/${e.id}`} className={rowLink}>
              <span className="min-w-0 flex-1 truncate text-mgh-text">{e.name}</span>
              <StatusBadge status={e.status} />
            </Link>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
