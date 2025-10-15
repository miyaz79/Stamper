"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "../path_to_your_design_system/components";
import { mainNavItems } from "./navItems";
import styles from "./page.module.css";

const weeklySummary = [
  { range: "9/29 ～ 10/5", hours: "37.50 h" },
  { range: "10/6 ～ 10/12", hours: "40.00 h" }
];

export default function Page() {
  const router = useRouter();
  const [activeNav, setActiveNav] = React.useState("dashboard");

  const handleNavClick = React.useCallback(
    (item: (typeof mainNavItems)[number]) => {
      setActiveNav(item.id);
      router.push(item.href);
    },
    [router]
  );

  const handleAutoExpense = React.useCallback(() => {
    router.push("/expenses/auto");
  }, [router]);

  return (
    <div className={styles.page}>
      <span className={styles.pageLabel}>DashboardPage</span>
      <main className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <h1>勤怠管理</h1>
          </div>
          <nav className={styles.headerNav} aria-label="メインメニュー">
            {mainNavItems.map((item) => {
              const isActive = item.id === activeNav;
              return (
                <Button
                  key={item.id}
                  className={`${styles.navButton} ${isActive ? styles.navButtonActive : ""}`.trim()}
                  type="button"
                  variant={isActive ? "primary" : "secondary"}
                  onClick={() => handleNavClick(item)}
                  aria-pressed={isActive}
                >
                  <span className={styles.navIcon} aria-hidden />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </header>

        <section className={styles.summary} aria-labelledby="monthly-summary">
          <div className={styles.summaryHeader}>
            <h2 id="monthly-summary">今月のサマリー（2025年9月）</h2>
          </div>
          <div className={styles.summaryGrid}>
            <Card className={styles.summaryCard} spacing="section" role="region" aria-labelledby="summary-weekly">
              <h3 id="summary-weekly">週単位のサマリー</h3>
              <ul className={styles.summaryList}>
                {weeklySummary.map((item) => (
                  <li className={styles.summaryRow} key={item.range}>
                    <span>{item.range}:</span>
                    <span>{item.hours}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className={styles.summaryCard} spacing="section" role="region" aria-labelledby="summary-tasks">
              <h3 id="summary-tasks">作業項目別合計時間</h3>
              <p className={styles.emptyCopy}>記録はまだありません。</p>
            </Card>
            <Card className={styles.summaryCard} spacing="section" role="region" aria-labelledby="summary-overtime">
              <h3 id="summary-overtime">残業時間</h3>
              <ul className={styles.summaryList}>
                <li className={styles.summaryRow}>
                  <span>通常残業:</span>
                  <span>0.00 h</span>
                </li>
                <li className={styles.summaryRow}>
                  <span>深夜残業:</span>
                  <span>0.00 h</span>
                </li>
              </ul>
            </Card>
            <Card className={styles.summaryCard} spacing="section" role="region" aria-labelledby="summary-leave">
              <h3 id="summary-leave">休暇</h3>
              <ul className={styles.summaryList}>
                <li className={styles.summaryRow}>
                  <span>全休:</span>
                  <span>0 D</span>
                </li>
                <li className={styles.summaryRow}>
                  <span>時間休:</span>
                  <span>0.00 h</span>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        <section className={styles.requests} aria-labelledby="request-header">
          <div className={styles.requestsHeader}>
            <h2 id="request-header">申請</h2>
          </div>
          <Card className={styles.requestCard} spacing="section" role="region" aria-labelledby="auto-expense">
            <div className={styles.requestContent}>
              <span className={styles.requestBadge} aria-hidden />
              <span id="auto-expense" className={styles.requestTitle}>
                自動経費申請
              </span>
            </div>
            <div className={styles.requestAction}>
              <Button type="button" variant="primary" onClick={handleAutoExpense}>
                申請ページを開く
              </Button>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
