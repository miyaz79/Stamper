"use client";

import clsx from "clsx";
import React from "react";
import styles from "./SelectField.module.css";

type Option = {
  value: string;
  label: string;
};

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  options: Option[];
  supportingText?: string;
  errorText?: string;
};

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ id, label, options, supportingText, errorText, className, ...props }, ref) => {
    const describedBy: string[] = [];
    if (supportingText) describedBy.push(`${id}-support`);
    if (errorText) describedBy.push(`${id}-error`);

    return (
      <div className={clsx(styles.field, errorText && styles.error, className)}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        <div className={styles.selectWrapper}>
          <select
            ref={ref}
            id={id}
            className={styles.select}
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
        </div>
        {supportingText && !errorText ? (
          <p id={`${id}-support`} className={styles.supportingText}>
            {supportingText}
          </p>
        ) : null}
        {errorText ? (
          <p id={`${id}-error`} className={styles.supportingText} role="alert">
            {errorText}
          </p>
        ) : null}
      </div>
    );
  }
);

SelectField.displayName = "SelectField";
