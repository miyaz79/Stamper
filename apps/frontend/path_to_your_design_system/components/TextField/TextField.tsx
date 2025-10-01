"use client";

import clsx from "clsx";
import React from "react";
import styles from "./TextField.module.css";

type TextFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  id: string;
  type?: "text" | "email" | "password";
  supportingText?: string;
  errorText?: string;
};

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, id, type = "text", supportingText, errorText, className, ...props }, ref) => {
    const describedBy = [] as string[];
    if (supportingText) describedBy.push(`${id}-support`);
    if (errorText) describedBy.push(`${id}-error`);

    return (
      <div className={clsx(styles.field, errorText && styles.error, className)}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        <div className={styles.inputWrapper}>
          <input
            ref={ref}
            id={id}
            type={type}
            className={styles.input}
            aria-invalid={Boolean(errorText)}
            aria-describedby={describedBy.join(" ") || undefined}
            {...props}
          />
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

TextField.displayName = "TextField";