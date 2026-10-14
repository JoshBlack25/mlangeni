"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  PageHeader,
  Tabs,
  Field,
  Input,
  EmptyState,
  SkeletonRows,
} from "@/app/components/dashboard/ui";
import EnquiryRow from "./EnquiryRow";

const filters = ["Pending", "Confirmed", "Cancelled", "All"];

export default function EnquiriesContent() {
  const [enquiries, setEnquiries] = useState(null); // null = loading
  const [activeFilter, setActiveFilter] = useState("Pending");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  const channelRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    async function loadEnquiries() {
      const { data, error: fetchError } = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (!mountedRef.current) return;

      if (fetchError) {
        console.error("Failed to load enquiries:", fetchError);
        setError("Couldn't load enquiries. Please refresh.");
        setEnquiries([]);
        return;
      }

      setEnquiries(data ?? []);
    }

    loadEnquiries();

    // Realtime — new/updated/deleted enquiries reflect live
    const channel = supabase.channel("admin-enquiries");

    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "enquiries" },
      (payload) => {
        if (!mountedRef.current) return;
        setEnquiries((current) => [payload.new, ...(current ?? [])]);
      },
    );

    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "enquiries" },
      (payload) => {
        if (!mountedRef.current) return;
        setEnquiries((current) =>
          (current ?? []).map((e) =>
            e.id === payload.new.id ? payload.new : e,
          ),
        );
      },
    );

    channel.on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "enquiries" },
      (payload) => {
        if (!mountedRef.current) return;
        setEnquiries((current) =>
          (current ?? []).filter((e) => e.id !== payload.old.id),
        );
      },
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  function handleStatusChange(id, newStatus) {
    setEnquiries((current) =>
      (current ?? []).map((e) =>
        e.id === id ? { ...e, status: newStatus } : e,
      ),
    );
  }

  const filteredEnquiries = useMemo(() => {
    if (!enquiries) return [];

    let result = enquiries;

    if (activeFilter !== "All") {
      result = result.filter((e) => e.status === activeFilter.toLowerCase());
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      // `phone` is nullable since db/006 and stays that way (see db/007), so
      // this can't assume a string — one null row would break every search.
      result = result.filter(
        (e) =>
          (e.name ?? "").toLowerCase().includes(q) ||
          (e.email ?? "").toLowerCase().includes(q) ||
          (e.phone ?? "").includes(q),
      );
    }

    return result;
  }, [enquiries, activeFilter, search]);

  const pendingCount = useMemo(
    () => (enquiries ?? []).filter((e) => e.status === "pending").length,
    [enquiries],
  );

  const tabItems = filters.map((filter) => {
    const count =
      filter === "Pending"
        ? pendingCount
        : filter === "All"
          ? (enquiries ?? []).length
          : null;
    return {
      value: filter,
      label: filter,
      count: count !== null && count > 0 ? count : undefined,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        density="dense"
        className="mb-0 md:mb-0"
        title="Enquiries"
        lead="Review incoming enquiries from guests and customers, and confirm bookings to lock in availability."
        actions={
          pendingCount > 0 && (
            <p className="text-sm tabular-nums text-mgh-muted">
              {pendingCount} {pendingCount === 1 ? "enquiry" : "enquiries"}{" "}
              awaiting review
            </p>
          )
        }
      />

      {/* TOOLBAR: filters + search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <Tabs
          items={tabItems}
          value={activeFilter}
          onChange={setActiveFilter}
          label="Filter enquiries by status"
          className="md:flex-1"
        />

        <Field label="Search enquiries" className="w-full md:w-72">
          <SearchInput
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
          />
        </Field>
      </div>

      {/* ERROR */}
      {error && (
        <p
          role="alert"
          className="rounded-control border border-mgh-danger/30 bg-mgh-danger/10 px-4 py-3 text-sm text-mgh-danger"
        >
          {error}
        </p>
      )}

      {/* LOADING / EMPTY / TABLE */}
      {enquiries === null ? (
        <SkeletonRows rows={6} label="Loading enquiries" />
      ) : filteredEnquiries.length === 0 ? (
        <EmptyState
          title={`No ${activeFilter !== "All" ? activeFilter.toLowerCase() : ""} enquiries`.replace(/\s+/g, " ")}
        >
          {activeFilter === "Pending"
            ? "New enquiries will appear here as they come in."
            : "Nothing to show in this filter right now."}
        </EmptyState>
      ) : (
        <div>
          <table className="hidden w-full border-collapse text-left text-body-dense md:table">
            <caption className="sr-only">{activeFilter} enquiries</caption>
            <thead>
              <tr className="border-b border-mgh-line">
                {COLUMNS.map((col) => (
                  <th
                    key={col.label}
                    scope="col"
                    className={`h-10 px-3 text-label font-semibold uppercase text-mgh-dim first:pl-0 last:pr-0 ${
                      col.align === "right" ? "text-right" : ""
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map((enquiry) => (
                <EnquiryRow
                  key={enquiry.id}
                  layout="table"
                  enquiry={enquiry}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-mgh-line-soft border-y border-mgh-line-soft md:hidden">
            {filteredEnquiries.map((enquiry) => (
              <EnquiryRow
                key={enquiry.id}
                layout="stacked"
                enquiry={enquiry}
                onStatusChange={handleStatusChange}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const COLUMNS = [
  { label: "Customer" },
  { label: "Event date" },
  { label: "Guests", align: "right" },
  { label: "Received" },
  { label: "Status" },
  { label: "Actions", align: "right" },
];

function SearchInput(props) {
  return (
    <div className="relative">
      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mgh-dim"
      />
      <Input {...props} className="pl-9" />
    </div>
  );
}
