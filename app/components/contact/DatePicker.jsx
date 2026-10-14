"use client";

import { useRef } from "react";

/**
 * The enquiry form's date field. Its label lives in the form, wired up by
 * `id`; this only renders the native date input (today onwards).
 */
export default function DatePicker({ id, value, onChange, error, describedBy, className }) {
  const inputRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  const handleClick = () => {
    inputRef.current?.showPicker?.();
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="date"
      value={value}
      min={today}
      aria-required="true"
      onClick={handleClick}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      className={className}
    />
  );
}
