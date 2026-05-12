"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";

const ALL_SESSIONS = ["Morning", "Afternoon", "Evening/Night"];

export default function SessionDropDown({
  value,
  onChange,
  selectedDate,
  error,
  showBadges = false,
  dark = false,
}) {
  const [bookedSessions, setBookedSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const toISODate = (date) => {
    if (!date) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const [month, day, year] = date.split("/");
    if (!month || !day || !year) return "";
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!selectedDate) return;
    const isoDate = toISODate(selectedDate);
    if (!isoDate) return;

    const fetchBookedSessions = async () => {
      setLoading(true);
      const { data, error: supabaseError } = await supabase
        .from("enquiries")
        .select("session")
        .eq("event_date", isoDate)
        .eq("status", "confirmed");

      if (supabaseError) {
        console.error("Error fetching sessions:", supabaseError);
        setBookedSessions([]);
      } else {
        setBookedSessions(data?.map((row) => row.session) || []);
      }
      setLoading(false);
    };

    fetchBookedSessions();
  }, [selectedDate]);

  useEffect(() => {
    onChange("");
  }, [selectedDate]);

  const availableSessions = selectedDate
    ? ALL_SESSIONS.filter((s) => !bookedSessions.includes(s))
    : [];

  const selectClass = dark
    ? `w-full bg-transparent border-0 outline-none text-sm cursor-pointer transition-all
       text-white disabled:text-[#444] disabled:cursor-not-allowed
       ${error ? "border-red-500" : ""}`
    : `border rounded-lg px-3 py-2 text-sm bg-white outline-none transition-all
       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
       disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
       ${error ? "border-red-500" : "border-gray-300"}`;

  const labelClass = dark ? "hidden" : "text-sm font-medium text-gray-700";

  return (
    <div className="flex flex-col gap-1">
      <label className={labelClass}>
        Session <span className="text-red-500">*</span>
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!selectedDate || loading}
        className={selectClass}
      >
        <option value="" className={dark ? "bg-[#0A0A0A] text-white" : "text-black"}>
          {!selectedDate
            ? "Select a date first"
            : loading
            ? "Checking availability..."
            : availableSessions.length === 0
            ? "No sessions available"
            : "Select a session"}
        </option>
        {availableSessions.map((session) => (
          <option
            key={session}
            value={session}
            className={dark ? "bg-[#0A0A0A] text-white" : "text-black"}
          >
            {session}
          </option>
        ))}
      </select>

      {showBadges && selectedDate && !loading && (
        <div className="flex flex-wrap gap-2 mt-1">
          {ALL_SESSIONS.map((session) => {
            const isBooked = bookedSessions.includes(session);
            return (
              <span
                key={session}
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  isBooked
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {session}: {isBooked ? "Unavailable" : "Available"}
              </span>
            );
          })}
        </div>
      )}

      {error && !dark && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}