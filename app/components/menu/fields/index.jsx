"use client";

import { controlClass, describedBy } from "./fieldStyles";

/**
 * Form field primitives for the booking flows.
 *
 * Every control routes its label, hint and error through `Field`, so
 * `aria-invalid` and `aria-describedby` are wired by construction rather than
 * per-field discipline. The element `id` is always the state field name, which
 * lets the submit handler focus the first invalid control by name.
 */

export function Field({ id, label, required, hint, error, children }) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-xs uppercase tracking-wider text-mgh-muted"
        >
          {label}
          {required && <span className="ml-1 text-mgh-gold">*</span>}
        </label>
      )}

      {children}

      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-mgh-faint">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs text-mgh-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  id,
  label,
  required,
  hint,
  error,
  type = "text",
  className,
  ...props
}) {
  return (
    <Field id={id} label={label} required={required} hint={hint} error={error}>
      <input
        id={id}
        name={id}
        type={type}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, { hint, error })}
        className={controlClass({ invalid: !!error, className })}
        {...props}
      />
    </Field>
  );
}

export function TimeField({ id, label, required, hint, error, ...props }) {
  return (
    <Field id={id} label={label} required={required} hint={hint} error={error}>
      <input
        id={id}
        name={id}
        type="time"
        step={300}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, { hint, error })}
        className={controlClass({ invalid: !!error, className: "tabular-nums" })}
        {...props}
      />
    </Field>
  );
}

export function SelectField({
  id,
  label,
  required,
  hint,
  error,
  options = [],
  placeholder = "Select…",
  ...props
}) {
  return (
    <Field id={id} label={label} required={required} hint={hint} error={error}>
      <select
        id={id}
        name={id}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, { hint, error })}
        className={controlClass({ invalid: !!error })}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function TextAreaField({
  id,
  label,
  required,
  hint,
  error,
  rows = 3,
  ...props
}) {
  return (
    <Field id={id} label={label} required={required} hint={hint} error={error}>
      <textarea
        id={id}
        name={id}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, { hint, error })}
        className={controlClass({ invalid: !!error, className: "resize-y" })}
        {...props}
      />
    </Field>
  );
}

/** A value the customer can see but not change — e.g. their account email. */
export function ReadOnlyField({ id, label, value, hint }) {
  return (
    <Field id={id} label={label} hint={hint}>
      <div
        id={id}
        className="w-full truncate rounded-xl border border-dashed border-mgh-line bg-mgh-surface-3 px-4 py-3 text-sm text-mgh-dim"
      >
        {value || "—"}
      </div>
    </Field>
  );
}

export { controlClass, describedBy };
