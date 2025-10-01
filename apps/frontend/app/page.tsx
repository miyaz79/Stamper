"use client";

import React from "react";
import { LoginPanel } from "../path_to_your_design_system/components";
import styles from "./page.module.css";

export default function Page() {
  const handleLogin = React.useCallback((values: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => {
    console.info("Login submitted", values);
  }, []);

  return (
    <main className={styles.wrapper}>
      <section className={styles.panelColumn}>
        <LoginPanel onSubmit={handleLogin} />
      </section>
      <section className={styles.heroColumn} aria-label="Stamperの特長">
        <span className={styles.heroBadge}>Time &amp; Expense Platform</span>
        <h2 className={styles.heroHeading}>
          働き方を可視化し、勤怠と経費の管理をもっとスマートに。
        </h2>
        <p className={styles.heroBody}>
          Stamperは日々の勤怠打刻から月次の承認フロー、経費申請までをワンストップで提供します。
          データの整合性を保ちながらチーム全体の生産性を高めましょう。
        </p>
      </section>
    </main>
  );
}
