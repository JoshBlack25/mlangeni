"use client";

import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function PhoneInputField({ value, onChange, error }) {
  return (
    <div className="mgh-phone w-full">
      <PhoneInput
        international
        defaultCountry="ZA"
        value={value}
        onChange={(val) => onChange(val ?? "")}
        className="w-full"
      />
    </div>
  );
}