"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Search } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
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
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.phone.includes(q),
      );
    }

    return result;
  }, [enquiries, activeFilter, search]);

  const pendingCount = useMemo(
    () => (enquiries ?? []).filter((e) => e.status === "pending").length,
    [enquiries],
  );

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1200px]">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
              <Send size={17} />
              <span>Enquiries</span>
            </div>

            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              Enquiries
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#A0A0A0] md:text-base">
              Review incoming enquiries from guests and customers, and confirm
              bookings to lock in availability.
            </p>
          </div>

          {pendingCount > 0 && (
            <div className="flex h-11 items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 text-sm text-[#D4AF37]">
              <span>
                {pendingCount} {pendingCount === 1 ? "enquiry" : "enquiries"}{" "}
                awaiting review
              </span>
            </div>
          )}
        </motion.div>

        {/* FILTERS + SEARCH */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10 flex flex-col gap-5 border-b border-[#252525] pb-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-6">
            {filters.map((filter) => {
              const active = activeFilter === filter;
              const count =
                filter === "Pending"
                  ? pendingCount
                  : filter === "All"
                    ? (enquiries ?? []).length
                    : null;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`relative pb-3 text-sm font-medium transition-colors duration-300 ${
                    active
                      ? "text-[#D4AF37]"
                      : "text-[#777777] hover:text-white"
                  }`}
                >
                  {filter}
                  {count !== null && count > 0 && (
                    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#D4AF37]/10 px-1.5 py-0.5 text-[10px] text-[#D4AF37]">
                      {count}
                    </span>
                  )}

                  {active && (
                    <motion.span
                      layoutId="enquiry-filter"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full rounded-lg border border-[#1F1F1F] bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder:text-[#666666] focus:border-[#D4AF37] focus:outline-none sm:w-64"
            />
          </div>
        </motion.div>

        {/* ERROR */}
        {error && (
          <div className="mt-6 border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* LOADING */}
        {enquiries === null ? (
          <div className="mt-6 flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-[#1F1F1F] bg-white/5"
              />
            ))}
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 border border-[#202020] bg-[#101010] px-6 py-20 text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#D4AF37]">
              <Send size={23} strokeWidth={1.5} />
            </div>

            <h2 className="mt-5 font-serif text-2xl text-white">
              No {activeFilter !== "All" ? activeFilter.toLowerCase() : ""}{" "}
              enquiries
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#666666]">
              {activeFilter === "Pending"
                ? "New enquiries will appear here as they come in."
                : "Nothing to show in this filter right now."}
            </p>
          </motion.div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {filteredEnquiries.map((enquiry, index) => (
                <motion.div
                  key={enquiry.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <EnquiryRow
                    enquiry={enquiry}
                    onStatusChange={handleStatusChange}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
