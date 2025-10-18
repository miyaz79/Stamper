"use client";

import type { HTMLAttributes } from "react";

type CardSpacing = "none" | "section";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  spacing?: CardSpacing;
};

export function Card({ className, spacing = "none", ...props }: CardProps) {
  const classes = [
    "rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary p-8 shadow-ambient",
    spacing === "section" ? "flex flex-col gap-6" : undefined,
    className
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes} {...props} />;
}
