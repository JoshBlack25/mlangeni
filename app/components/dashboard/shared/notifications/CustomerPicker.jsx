"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { Field, SearchInput } from "@/app/components/dashboard/ui";

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
      <div className="flex items-center justify-between rounded-lg border border-mgh-gold/30 bg-mgh-gold/5 px-4 py-3">
        <span className="text-sm text-mgh-text">
          {value.first_name} {value.last_name}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-mgh-gold hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div>
      <Field label="Who is this about?">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Customer name or email"
        />
      </Field>

      <p role="status" className="mt-2 min-h-4 text-caption text-mgh-dim">
        {loading ? "Searching…" : ""}
      </p>

      {search.trim().length >= 2 && results.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-mgh-line">
          {results.map((c) => (
            <button
              key={c.customer_id}
              type="button"
              onClick={() => {
                onChange(c);
                setSearch("");
                setResults([]);
              }}
              className="block w-full border-b border-mgh-line px-4 py-3 text-left text-sm text-mgh-text last:border-0 hover:bg-mgh-surface-2"
            >
              <p>
                {c.first_name} {c.last_name}
              </p>
              <p className="text-xs text-mgh-dim">{c.email}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
