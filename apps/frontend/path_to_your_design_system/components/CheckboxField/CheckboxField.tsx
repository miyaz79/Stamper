"use client";

import clsx from "clsx";
import React from "react";
import styles from "./CheckboxField.module.css";

type CheckboxFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  label: string;
  supportingText?: string;
};

export const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ id, label, supportingText, className, ...props }, ref) => {
    return (
      <label className={clsx(styles.field, className)} htmlFor={id}>
        <input ref={ref} id={id} type="checkbox" className={styles.input} {...props} />
        <span className={styles.box} aria-hidden />
        <span className={styles.labelText}>{label}</span>
        {supportingText ? <span className={styles.supportingText}>{supportingText}</span> : null}
      </label>
    );
  }
);

CheckboxField.displayName = "CheckboxField";
