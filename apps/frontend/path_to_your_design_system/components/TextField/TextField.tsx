"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  supportingText?: string;
  errorText?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, id, type = "text", supportingText, errorText, className, ...props }, ref) => {
    const describedBy: string[] = [];
    if (supportingText) describedBy.push(`${id}-support`);
    if (errorText) describedBy.push(`${id}-error`);

    const fieldClasses = ["flex flex-col gap-1", className].filter(Boolean).join(" ");
    const inputClasses = [
      "w-full min-h-[var(--input-height)] rounded-[var(--radius-md)] border border-border-subtle bg-surface-primary px-[var(--input-padding-x)] py-[var(--input-padding-y)] text-base text-text-primary transition focus-visible:outline-none focus-visible:border-brand-primary focus-visible:ring-4 focus-visible:ring-brand-primary/15 disabled:cursor-not-allowed disabled:bg-surface-muted placeholder:text-text-tertiary",
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
        <div className="relative flex items-stretch">
          <input
            ref={ref}
            id={id}
            type={type}
            className={inputClasses}
            aria-invalid={Boolean(errorText)}
            aria-describedby={describedBy.join(" ") || undefined}
            {...props}
          />
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

TextField.displayName = "TextField";