"use client";

import PhoneInput from "react-phone-number-input";

/** International phone input (South Africa first), labelled by the form. */
export default function PhoneInputField({ id, value, onChange, error, describedBy }) {
  return (
    <div className="mgh-phone w-full">
      <PhoneInput
        international
        defaultCountry="ZA"
        value={value}
        onChange={(val) => onChange(val ?? "")}
        className="w-full"
        countrySelectProps={{ "aria-label": "Country code" }}
        numberInputProps={{
          id,
          "aria-required": true,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy,
        }}
      />
    </div>
  );
}
