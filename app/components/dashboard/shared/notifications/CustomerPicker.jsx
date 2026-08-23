"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";

export default function CustomerPicker({ value, onChange }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.trim().length < 2) {
      return;
    }

    let active = true;

    const timeout = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("customer")
        .select("customer_id, user_id, first_name, last_name, email")
        .or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`,
        )
        .limit(8);

      if (!active) return;

      if (error) {
        console.error("Customer search failed:", error);
        setResults([]);
      } else {
        setResults(data ?? []);
      }
      setLoading(false);
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [search]);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-4 py-3">
        <span className="text-sm text-white">
          {value.first_name} {value.last_name}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-[#D4AF37] hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#A0A0A0]">
        Who is this about?
      </label>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search customer by name or email..."
        className="w-full rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
      />

      {loading && <p className="mt-2 text-xs text-[#666666]">Searching...</p>}

      {search.trim().length >= 2 && results.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-[#1F1F1F]">
          {results.map((c) => (
            <button
              key={c.customer_id}
              type="button"
              onClick={() => {
                onChange(c);
                setSearch("");
                setResults([]);
              }}
              className="block w-full border-b border-[#1F1F1F] px-4 py-3 text-left text-sm text-white last:border-0 hover:bg-white/5"
            >
              <p>
                {c.first_name} {c.last_name}
              </p>
              <p className="text-xs text-[#666666]">{c.email}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
