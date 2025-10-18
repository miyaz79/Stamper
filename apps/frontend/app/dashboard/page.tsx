"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "../../path_to_your_design_system/components";
import { getCurrentCognitoSession } from "../../lib/cognitoClient";
import { mainNavItems, type MainNavItemId } from "../navItems";

const weeklySummary = [
  { range: "9/29 ～ 10/5", hours: "37.50 h" },
  { range: "10/6 ～ 10/12", hours: "40.00 h" }
];

const adminDestinations = [
  {
    id: "work-summary",
    title: "作業時間集計",
    description: "部門・メンバー別の勤怠状況を俯瞰できます。",
    href: "/admin/work-summary",
    indicatorClass: "bg-gradient-to-tr from-brand-primary to-brand-primary-dark",
    actionLabel: "作業時間集計へ"
  },
  {
    id: "task-management",
    title: "作業項目管理",
    description: "大・中・小分類の作業項目を最新の構成に保ちます。",
    href: "/admin/task-management",
    indicatorClass: "bg-gradient-to-tr from-brand-secondary to-brand-primary-dark",
    actionLabel: "作業項目管理へ"
  }
];

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeNav, setActiveNav] = useState<MainNavItemId>("dashboard");

  useEffect(() => {
    let canceled = false;

    getCurrentCognitoSession()
      .then((session) => {
        if (canceled) return;
        if (!session) {
          router.replace("/");
          return;
        }
        setIsAuthorized(true);
      })
      .catch((err) => {
        console.warn("Failed to verify Cognito session on dashboard", err);
        router.replace("/");
      });

    return () => {
      canceled = true;
    };
  }, [router]);

  const handleNavClick = useCallback(
    (item: (typeof mainNavItems)[number]) => {
      setActiveNav(item.id);
      router.push(item.href);
    },
    [router]
  );

  const handleExpenseRequest = useCallback(() => {
    router.push("/expenses");
  }, [router]);

  const handleAttendanceApproval = useCallback(() => {
    router.push("/admin/attendance-approval");
  }, [router]);

  const requestShortcuts = [
    {
      id: "expense-application",
      indicatorClass: "bg-gradient-to-tr from-brand-secondary to-brand-primary",
      title: "経費申請",
      description: "領収書の登録から申請送信まで一括で完了できます。",
      actionLabel: "経費申請へ",
      onClick: handleExpenseRequest
    },
    {
      id: "attendance-approval",
      indicatorClass: "bg-gradient-to-tr from-brand-primary-dark to-brand-secondary",
      title: "勤怠承認",
      description: "提出された勤務表の内容を確認し承認または差戻しできます。",
      actionLabel: "勤怠承認へ",
      onClick: handleAttendanceApproval
    }
  ];

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-12 md:px-12">
      <span className="self-start rounded-[var(--radius-xl)] border border-border-strong bg-surface-contrast px-3 py-1 text-sm font-medium text-brand-primary">
        DashboardPage
      </span>
      <main className="w-full max-w-5xl rounded-[var(--radius-xl)] bg-surface-shell p-10 shadow-elevated">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">勤怠管理</h1>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="メインメニュー">
            {mainNavItems
              .filter((item) => item.id !== "expenses")
              .map((item) => {
              const isActive = item.id === activeNav;
              return (
                <Button
                  key={item.id}
                  className={`min-h-0 gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-semibold ${
                    isActive ? "shadow-ambient" : ""
                  }`}
                  type="button"
                  variant={isActive ? "primary" : "secondary"}
                  onClick={() => handleNavClick(item)}
                  aria-pressed={isActive}
                >
                  <span
                    className="h-4 w-4 rounded-[var(--radius-sm)] bg-gradient-to-tr from-brand-primary to-brand-primary-dark shadow-inner"
                    aria-hidden
                  />
                  {item.label}
                </Button>
                );
              })}
          </nav>
        </header>

        <section className="mt-12 flex flex-col gap-6" aria-labelledby="monthly-summary">
          <div>
            <h2 id="monthly-summary" className="text-xl font-semibold text-text-primary">
              今月のサマリー（2025年9月）
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card spacing="section" className="min-h-[200px]" role="region" aria-labelledby="summary-weekly">
              <h3 id="summary-weekly" className="text-lg font-semibold text-text-primary">
                週単位のサマリー
              </h3>
              <ul className="space-y-2">
                {weeklySummary.map((item) => (
                  <li
                    key={item.range}
                    className="flex items-center justify-between rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-sm text-text-secondary"
                  >
                    <span>{item.range}:</span>
                    <span className="font-semibold text-text-primary">{item.hours}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card spacing="section" className="min-h-[200px]" role="region" aria-labelledby="summary-tasks">
              <h3 id="summary-tasks" className="text-lg font-semibold text-text-primary">
                作業項目別合計時間
              </h3>
              <p className="text-sm text-text-tertiary">記録はまだありません。</p>
            </Card>
            <Card spacing="section" className="min-h-[200px]" role="region" aria-labelledby="summary-overtime">
              <h3 id="summary-overtime" className="text-lg font-semibold text-text-primary">
                残業時間
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center justify-between rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-sm text-text-secondary">
                  <span>通常残業:</span>
                  <span className="font-semibold text-text-primary">0.00 h</span>
                </li>
                <li className="flex items-center justify-between rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-sm text-text-secondary">
                  <span>深夜残業:</span>
                  <span className="font-semibold text-text-primary">0.00 h</span>
                </li>
              </ul>
            </Card>
            <Card spacing="section" className="min-h-[200px]" role="region" aria-labelledby="summary-leave">
              <h3 id="summary-leave" className="text-lg font-semibold text-text-primary">
                休暇
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center justify-between rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-sm text-text-secondary">
                  <span>全休:</span>
                  <span className="font-semibold text-text-primary">0 D</span>
                </li>
                <li className="flex items-center justify-between rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-sm text-text-secondary">
                  <span>時間休:</span>
                  <span className="font-semibold text-text-primary">0.00 h</span>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        <section className="mt-12 flex flex-col gap-4" aria-labelledby="admin-shortcuts">
          <div>
            <h2 id="admin-shortcuts" className="text-xl font-semibold text-text-primary">
              管理
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {adminDestinations.map((destination) => (
              <Card
                key={destination.id}
                spacing="section"
                className="flex h-full flex-col justify-between"
                role="region"
                aria-labelledby={`${destination.id}-title`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${destination.indicatorClass}`} aria-hidden />
                    <h3 id={`${destination.id}-title`} className="text-lg font-semibold text-text-primary">
                      {destination.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm text-text-tertiary">{destination.description}</p>
                </div>
                <div className="mt-6">
                  <Button type="button" variant="primary" onClick={() => router.push(destination.href)}>
                    {destination.actionLabel}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12 flex flex-col gap-4" aria-labelledby="request-header">
          <div>
            <h2 id="request-header" className="text-xl font-semibold text-text-primary">
              申請
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {requestShortcuts.map((shortcut) => (
              <Card
                key={shortcut.id}
                spacing="section"
                role="region"
                aria-labelledby={`${shortcut.id}-title`}
                className="flex h-full flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${shortcut.indicatorClass}`} aria-hidden />
                    <h3 id={`${shortcut.id}-title`} className="text-lg font-semibold text-text-primary">
                      {shortcut.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm text-text-tertiary">{shortcut.description}</p>
                </div>
                <div className="mt-6">
                  <Button type="button" variant="primary" onClick={shortcut.onClick}>
                    {shortcut.actionLabel}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
