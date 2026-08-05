"use client";

import { useRef, useState } from "react";

export default function DatePicker({ value, onChange, error }) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  const handleClick = () => {
    inputRef.current?.showPicker();
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        Date of Event <span className="text-red-500">*</span>
      </label>
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={today}
        onClick={handleClick}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white outline-none transition-all
          ${isFocused ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-300"}
          ${error ? "border-red-500" : ""}
        `}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}