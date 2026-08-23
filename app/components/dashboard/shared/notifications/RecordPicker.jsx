"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";

const categoryConfig = {
  order: {
    label: "Which order is this about?",
    table: "orders",
    idField: "order_id",
    query: (customerId) =>
      supabase
        .from("orders")
        .select("order_id, event_date, event_type:event_type_id ( event_name )")
        .eq("customer_id", customerId)
        .order("event_date", { ascending: false }),
    formatLabel: (row) =>
      `${row.event_type?.event_name ?? "Event"} — ${new Date(row.event_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`,
    linkPrefix: "/orders",
  },
  consultation: {
    label: "Which consultation is this about?",
    table: "consultations",
    idField: "consultations_id",
    query: (customerId) =>
      supabase
        .from("consultations")
        .select("consultations_id, meeting_date, status")
        .eq("customer_id", customerId)
        .order("meeting_date", { ascending: false }),
    formatLabel: (row) =>
      `${new Date(row.meeting_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} — ${row.status}`,
    linkPrefix: "/consultations",
  },
  invoice: {
    label: "Which invoice is this about?",
    table: "invoices",
    idField: "invoices_id",
    query: (customerId) =>
      supabase
        .from("invoices")
        .select(
          "invoices_id, total_amount, status, due_date, consultations!inner(customer_id)",
        )
        .eq("consultations.customer_id", customerId)
        .order("due_date", { ascending: false }),
    formatLabel: (row) =>
      `R${row.total_amount} — ${row.status} (due ${new Date(row.due_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })})`,
    linkPrefix: "/invoices",
  },
  enquiry: {
    label: "Which enquiry is this about?",
    table: "enquiries",
    idField: "id",
    query: (customerId, userId) =>
      supabase
        .from("enquiries")
        .select("id, event_date, status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    formatLabel: (row) =>
      `${new Date(row.event_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} — ${row.status}`,
    linkPrefix: "/enquiries",
  },
};

export default function RecordPicker({
  category,
  customerId,
  userId,
  basePath,
  value,
  onChange,
}) {
  const [records, setRecords] = useState(null); // null = loading

  useEffect(() => {
    if (!category || category === "general" || !customerId) {
      return;
    }

    const config = categoryConfig[category];
    if (!config) return;

    let active = true;

    config.query(customerId, userId).then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error(`Failed to load ${category} records:`, error);
        setRecords([]);
        return;
      }
      setRecords(data ?? []);
    });

    return () => {
      active = false;
    };
  }, [category, customerId, userId]);

  if (!category || category === "general") return null;
  if (!customerId) return null;

  const config = categoryConfig[category];

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#A0A0A0]">
        {config.label}
      </label>

      {records === null ? (
        <div className="h-11 animate-pulse rounded-lg border border-[#1F1F1F] bg-white/5" />
      ) : records.length === 0 ? (
        <p className="rounded-lg border border-[#1F1F1F] bg-white/5 px-4 py-3 text-sm text-[#666666]">
          No {category} records found.
        </p>
      ) : (
        <select
          value={value ?? ""}
          onChange={(e) => {
            const record = records.find(
              (r) => String(r[config.idField]) === e.target.value,
            );
            if (!record) {
              onChange(null);
              return;
            }
            onChange({
              id: record[config.idField],
              label: config.formatLabel(record),
              linkPath: `${basePath}${config.linkPrefix}/${record[config.idField]}`,
            });
          }}
          className="w-full rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
        >
          <option value="">Select a {category}...</option>
          {records.map((r) => (
            <option key={r[config.idField]} value={r[config.idField]}>
              {config.formatLabel(r)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
