"use client";

import { forwardRef } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";

type Option = {
  value: string;
  label: string;
};

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  options: Option[];
  supportingText?: string;
  errorText?: string;
  endAdornment?: ReactNode;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ id, label, options, supportingText, errorText, className, endAdornment, ...props }, ref) => {
    const describedBy: string[] = [];
    if (supportingText) describedBy.push(`${id}-support`);
    if (errorText) describedBy.push(`${id}-error`);

    const fieldClasses = ["flex flex-col gap-1", className].filter(Boolean).join(" ");
    const selectClasses = [
      "w-full min-h-[var(--input-height)] appearance-none rounded-[var(--radius-md)] border border-border-subtle bg-surface-primary px-[var(--input-padding-x)] text-base text-text-primary transition focus-visible:outline-none focus-visible:border-brand-primary focus-visible:ring-4 focus-visible:ring-brand-primary/15 disabled:cursor-not-allowed disabled:bg-surface-muted",
      errorText ? "border-brand-accent focus-visible:border-brand-accent focus-visible:ring-brand-accent/20" : undefined
    ]
      .filter(Boolean)
      .join(" ");

    const supportingTextClasses = errorText
      ? "text-sm text-brand-accent"
      : "text-sm text-text-tertiary";

    return (
      <div className={fieldClasses}>
        <label className="text-sm font-semibold text-text-secondary" htmlFor={id}>
          {label}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={`${selectClasses} pr-12`}
            aria-invalid={Boolean(errorText)}
            aria-describedby={describedBy.join(" ") || undefined}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-[var(--input-padding-x)] text-text-tertiary"
          >
            {endAdornment ?? (
              <svg viewBox="0 0 12 8" className="h-3 w-3" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </div>
        {supportingText && !errorText ? (
          <p id={`${id}-support`} className={supportingTextClasses}>
            {supportingText}
          </p>
        ) : null}
        {errorText ? (
          <p id={`${id}-error`} className={supportingTextClasses} role="alert">
            {errorText}
          </p>
        ) : null}
      </div>
    );
  }
);

SelectField.displayName = "SelectField";
