"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type TextLinkProps = ComponentProps<typeof Link> & {
  icon?: ReactNode;
};

export function TextLink({ className, icon, children, ...props }: TextLinkProps) {
  const classes = [
    "inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary/40 focus-visible:outline-offset-4 hover:text-brand-primary-dark",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link className={classes} {...props}>
      {children}
      {icon ?? null}
    </Link>
  );
}