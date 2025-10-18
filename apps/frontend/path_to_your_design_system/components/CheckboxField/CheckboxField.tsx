"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type CheckboxFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  label: string;
  supportingText?: string;
};

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ id, label, supportingText, className, ...props }, ref) => {
    const containerClasses = [
      "inline-flex items-start gap-2 cursor-pointer select-none text-sm text-text-secondary",
      className
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <label className={containerClasses} htmlFor={id}>
        <span className="relative mt-1 inline-flex">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <span
            aria-hidden
            className="flex h-5 w-5 items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-primary transition peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-primary peer-checked:border-brand-primary peer-checked:bg-brand-primary peer-disabled:border-border-subtle peer-disabled:bg-surface-muted"
          />
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 m-auto h-2.5 w-3 text-text-inverse opacity-0 transition-opacity peer-checked:opacity-100"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10.5 1.5L4.5 7 1.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-semibold text-text-primary">{label}</span>
          {supportingText ? <span className="text-sm text-text-tertiary">{supportingText}</span> : null}
        </span>
      </label>
    );
  }
);

CheckboxField.displayName = "CheckboxField";
