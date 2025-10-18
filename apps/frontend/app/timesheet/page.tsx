"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "../../path_to_your_design_system/components";
import { getCurrentCognitoSession } from "../../lib/cognitoClient";
import { mainNavItems, type MainNavItemId } from "../navItems";

type TimesheetEntry = {
  id: string;
  date: string;
  weekday: string;
  startTime: string;
  endTime: string;
  breakHours: number;
  totalHours: number;
  tasks: string[];
};

const timesheetData: TimesheetEntry[] = [
  {
    id: "2025-09-01",
    date: "2025-09-01",
    weekday: "月",
    startTime: "09:00",
    endTime: "18:00",
    breakHours: 1,
    totalHours: 7.50,
    tasks: ["要件定義", "設計レビュー"]
  },
  {
    id: "2025-09-02",
    date: "2025-09-02",
    weekday: "火",
    startTime: "09:30",
    endTime: "19:30",
    breakHours: 1.5,
    totalHours: 8.75,
    tasks: ["実装", "コードレビュー"]
  },
  {
    id: "2025-09-03",
    date: "2025-09-03",
    weekday: "水",
    startTime: "09:30",
    endTime: "18:00",
    breakHours: 1,
    totalHours: 7.50,
    tasks: ["実装"]
  },
  {
    id: "2025-09-04",
    date: "2025-09-04",
    weekday: "木",
    startTime: "-",
    endTime: "-",
    breakHours: 0,
    totalHours: 0,
    tasks: ["(全休)"]
  },
  {
    id: "2025-09-05",
    date: "2025-09-05",
    weekday: "金",
    startTime: "09:30",
    endTime: "21:30",
    breakHours: 1.5,
    totalHours: 10.50,
    tasks: ["テスト", "障害対応"]
  },
  {
    id: "2025-09-06",
    date: "2025-09-06",
    weekday: "土",
    startTime: "-",
    endTime: "-",
    breakHours: 0,
    totalHours: 0,
    tasks: [""]
  }
];

const formatDateLabel = (value: string) => {
  const instance = new Date(value);
  const month = String(instance.getMonth() + 1).padStart(2, "0");
  const day = String(instance.getDate()).padStart(2, "0");
  return `${month}/${day}`;
};

const formatHours = (value: number) => value.toFixed(2);

const monthLabel = "2025年9月";

export default function TimesheetPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeNav, setActiveNav] = useState<MainNavItemId>("timesheet");
  const [message, setMessage] = useState<string | null>(null);

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
      .catch((error) => {
        console.warn("Failed to verify Cognito session on timesheet", error);
        router.replace("/");
      });

    return () => {
      canceled = true;
    };
  }, [router]);

  const totals = useMemo(() => {
    return timesheetData.reduce(
      (acc, entry) => {
        const overtimeHours = Math.max(0, entry.totalHours - 7.5);
        const workedPastTen = entry.endTime !== "-" && entry.endTime >= "22:00";
        const midnightHours = workedPastTen ? Math.max(0, entry.totalHours - 12.5) : 0;
        const leaveHours = entry.tasks.some((task) => task.includes("全休")) ? 7.5 : 0;

        return {
          total: acc.total + entry.totalHours,
          overtime: acc.overtime + overtimeHours,
          midnight: acc.midnight + midnightHours,
          leave: acc.leave + leaveHours
        };
      },
      { total: 0, overtime: 0, midnight: 0, leave: 0 }
    );
  }, []);

  const handleNavClick = useCallback(
    (item: (typeof mainNavItems)[number]) => {
      setActiveNav(item.id);
      router.push(item.href);
    },
    [router]
  );

  const handleExport = useCallback((type: "pdf" | "csv") => {
    setMessage(`${type.toUpperCase()} 出力は現在準備中です。`);
    setTimeout(() => setMessage(null), 2500);
  }, []);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-12 md:px-12">
      <span className="self-start rounded-[var(--radius-xl)] border border-border-strong bg-surface-contrast px-3 py-1 text-sm font-medium text-brand-primary">
        TimesheetPage
      </span>
      <main className="w-full max-w-6xl rounded-[var(--radius-xl)] bg-surface-shell p-10 shadow-elevated">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">勤務表</p>
            <h1 className="text-2xl font-bold text-text-primary">勤務表表示</h1>
            <p className="text-sm text-text-secondary">{monthLabel}</p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="メインメニュー">
            {mainNavItems.map((item) => {
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

        {message ? (
          <div
            className="mt-8 rounded-[var(--radius-md)] border border-brand-secondary/40 bg-brand-secondary/10 px-4 py-3 text-sm text-brand-secondary"
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        ) : null}

        <section className="mt-10 flex flex-col gap-6" aria-labelledby="timesheet-table-heading">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <h2 id="timesheet-table-heading" className="text-xl font-semibold text-text-primary">
                月間勤務表
              </h2>
              <p className="text-sm text-text-secondary">
                勤怠計算ルールに基づき自動算出された日別の勤務情報です。PDF や CSV 出力は順次提供予定です。
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => handleExport("pdf")}>
                PDF 出力
              </Button>
              <Button type="button" variant="secondary" onClick={() => handleExport("csv")}>
                CSV 出力
              </Button>
            </div>
          </div>

          <Card spacing="section" className="gap-6" role="region" aria-labelledby="timesheet-table-heading">
            <div className="overflow-x-auto">
              <table className="min-w-[960px] border-separate border-spacing-0 text-left text-sm text-text-secondary">
                <thead className="bg-surface-muted/60 text-xs uppercase tracking-wide text-text-tertiary">
                  <tr>
                    <th className="sticky left-0 z-10 bg-surface-muted/60 px-4 py-3 font-semibold text-text-secondary">日付</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">曜日</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">開始</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">終了</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">休憩</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">合計</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">作業内容</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheetData.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-border-subtle transition hover:bg-surface-muted/60"
                    >
                      <td className="sticky left-0 z-[1] whitespace-nowrap bg-surface-shell px-4 py-3 font-semibold text-text-primary">
                        {formatDateLabel(entry.date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{entry.weekday}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-base text-text-primary">{entry.startTime}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-base text-text-primary">{entry.endTime}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-base text-text-primary">{formatHours(entry.breakHours)}h</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-base font-semibold text-text-primary">
                        {formatHours(entry.totalHours)}h
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {entry.tasks.filter(Boolean).length > 0 ? entry.tasks.filter(Boolean).join("、") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-4" aria-label="勤務サマリー">
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">合計勤務時間</p>
            <p className="font-mono text-2xl font-bold text-text-primary">{formatHours(totals.total)}h</p>
          </Card>
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">残業時間</p>
            <p className="font-mono text-2xl font-bold text-text-primary">{formatHours(totals.overtime)}h</p>
          </Card>
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">深夜残業</p>
            <p className="font-mono text-2xl font-bold text-text-primary">{formatHours(totals.midnight)}h</p>
          </Card>
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">休暇取得</p>
            <p className="font-mono text-2xl font-bold text-text-primary">{formatHours(totals.leave)}h</p>
          </Card>
        </section>
      </main>
    </div>
  );
}
