"use client";

import clsx from "clsx";
import Link from "next/link";
import React from "react";
import styles from "./TextLink.module.css";

type TextLinkProps = React.ComponentProps<typeof Link> & {
  icon?: React.ReactNode;
};

export function TextLink({ className, icon, children, ...props }: TextLinkProps) {
  return (
    <Link className={clsx(styles.link, className)} {...props}>
      {children}
      {icon ? icon : null}
    </Link>
  );
}