"use client";

import React from "react";
import styles from "./Card.module.css";

type CardSpacing = "none" | "section";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  spacing?: CardSpacing;
};

export function Card({ className, spacing = "none", ...props }: CardProps) {
  const classes = [styles.card];
  if (spacing === "section") {
    classes.push(styles.sectionSpacing);
  }
  if (className) {
    classes.push(className);
  }
  return <div className={classes.join(" ")} {...props} />;
}
