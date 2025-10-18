"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fluid?: boolean;
  iconOnly?: boolean;
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-transparent px-5 min-h-[var(--button-height)] text-base font-semibold leading-tight tracking-tight transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-tr from-brand-primary to-brand-primary-dark text-text-inverse shadow-elevated transform-gpu hover:-translate-y-[1px]",
  secondary:
    "bg-transparent border border-border-strong text-brand-primary hover:bg-surface-muted"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", fluid = false, iconOnly = false, disabled, children, ...props },
    ref
  ) => {
    const classes = [
      baseClasses,
      variantClasses[variant],
      fluid ? "w-full" : undefined,
      iconOnly ? "px-0 w-[var(--button-height)] aspect-square" : undefined,
      className
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} className={classes} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";