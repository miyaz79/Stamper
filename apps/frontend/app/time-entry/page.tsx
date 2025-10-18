"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CheckboxField,
  SelectField,
  TextField
} from "../../path_to_your_design_system/components";
import { getCurrentCognitoSession } from "../../lib/cognitoClient";
import { mainNavItems, type MainNavItemId } from "../navItems";
import styles from "./page.module.css";

type WorkItem = {
  id: string;
  department: string;
  project: string;
  task: string;
  hours: string;
};

type LeaveType = "full" | "hourly";

type Summary = {
  workHours: number;
  leaveHours: number;
  totalHours: number;
  breakHours: number;
  startTime: string;
  endTime: string;
  overtime: number;
  midnightOvertime: number;
};

const departmentOptions = [
  { value: "", label: "部署を選択" },
  { value: "dev", label: "開発部" },
  { value: "biz", label: "事業推進部" },
  { value: "ops", label: "オペレーション部" }
];

const projectOptions = [
  { value: "", label: "プロジェクトを選択" },
  { value: "stamper", label: "Stamper 開発" },
  { value: "client-a", label: "クライアントA" },
  { value: "internal", label: "社内改善" }
];

const taskOptions = [
  { value: "", label: "タスクを選択" },
  { value: "planning", label: "要件定義" },
  { value: "design", label: "設計" },
  { value: "coding", label: "実装" },
  { value: "testing", label: "テスト" }
];

const leaveTypeOptions = [
  { value: "full", label: "全休 (7.5h)" },
  { value: "hourly", label: "時間休" }
];

const createWorkItem = (): WorkItem => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
  department: "",
  project: "",
  task: "",
  hours: ""
});

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTime = (minutes: number | null) => {
  if (minutes === null || Number.isNaN(minutes)) return "--:--";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const clampNumber = (value: string) => {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return 0;
  return parsed;
};

const computeSummary = (
  targetDate: string,
  workItems: WorkItem[],
  isLeave: boolean,
  leaveType: LeaveType,
  hourlyLeaveHours: string
): Summary => {
  const isFullLeave = isLeave && leaveType === "full";
  const workHours = isFullLeave
    ? 0
    : workItems.reduce((total, item) => total + clampNumber(item.hours), 0);
  const leaveHours = isLeave ? (leaveType === "full" ? 7.5 : clampNumber(hourlyLeaveHours)) : 0;
  const totalHours = workHours + leaveHours;

  if (isFullLeave) {
    return {
      workHours,
      leaveHours,
      totalHours,
      breakHours: 0,
      startTime: "--:--",
      endTime: "--:--",
      overtime: 0,
      midnightOvertime: 0
    };
  }

  const date = new Date(targetDate);
  const day = date.getDay();
  const defaultStartMinutes = day === 1 ? 9 * 60 : 9 * 60 + 30; // Monday 9:00, others 9:30
  const workMinutes = Math.round(workHours * 60);

  if (workMinutes === 0) {
    return {
      workHours,
      leaveHours,
      totalHours,
      breakHours: 0,
      startTime: "--:--",
      endTime: "--:--",
      overtime: 0,
      midnightOvertime: 0
    };
  }

  let breakMinutes = workMinutes > 0 ? 60 : 0;
  let endMinutes = defaultStartMinutes + workMinutes + breakMinutes;

  if (endMinutes > 18 * 60) {
    breakMinutes += 30;
    endMinutes = defaultStartMinutes + workMinutes + breakMinutes;
  }

  const overtimeMinutes = Math.max(0, endMinutes - 18 * 60);
  const midnightMinutes = Math.max(0, endMinutes - 22 * 60);
  const regularOvertime = Math.max(0, overtimeMinutes - midnightMinutes);

  return {
    workHours,
    leaveHours,
    totalHours,
    breakHours: breakMinutes / 60,
    startTime: formatTime(defaultStartMinutes),
    endTime: formatTime(endMinutes),
    overtime: regularOvertime / 60,
    midnightOvertime: midnightMinutes / 60
  };
};

export default function TimeEntryPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [activeNav, setActiveNav] = React.useState<MainNavItemId>("time-entry");
  const [workItems, setWorkItems] = React.useState<WorkItem[]>([createWorkItem(), createWorkItem(), createWorkItem()]);
  const [selectedDate, setSelectedDate] = React.useState<string>(() => formatDateForInput(new Date()));
  const [isLeave, setIsLeave] = React.useState(false);
  const [leaveType, setLeaveType] = React.useState<LeaveType>("full");
  const [hourlyLeaveHours, setHourlyLeaveHours] = React.useState("0.0");
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
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
        console.warn("Failed to verify Cognito session on time-entry", err);
        router.replace("/");
      });

    return () => {
      canceled = true;
    };
  }, [router]);

  const summary = React.useMemo(
    () => computeSummary(selectedDate, workItems, isLeave, leaveType, hourlyLeaveHours),
    [hourlyLeaveHours, isLeave, leaveType, selectedDate, workItems]
  );

  const handleNavClick = React.useCallback(
    (item: (typeof mainNavItems)[number]) => {
      setActiveNav(item.id);
      router.push(item.href);
    },
    [router]
  );

  const updateWorkItem = React.useCallback(
    (id: string, key: keyof WorkItem, value: string) => {
      setWorkItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
    },
    []
  );

  const handleHoursChange = React.useCallback(
    (id: string, value: string) => {
      const sanitized = value === "" ? "" : Number(value).toFixed(2);
      setWorkItems((prev) => prev.map((item) => (item.id === id ? { ...item, hours: sanitized } : item)));
    },
    []
  );

  const addWorkItem = React.useCallback(() => {
    setWorkItems((prev) => [...prev, createWorkItem()]);
  }, []);

  const removeWorkItem = React.useCallback((id: string) => {
    setWorkItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }, []);

  const handleLeaveToggle = React.useCallback((checked: boolean) => {
    setIsLeave(checked);
    setMessage(null);
  }, []);

  const handleLeaveTypeChange = React.useCallback((value: string) => {
    setLeaveType(value as LeaveType);
    setMessage(null);
  }, []);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setMessage("日次記録を保存しました。");
      setTimeout(() => setMessage(null), 4000);
    },
    []
  );

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={styles.page}>
      <span className={styles.pageLabel}>TimeLogsPage</span>
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

        <section className={styles.logSection} aria-labelledby="time-entry-heading">
          <Card spacing="section" className={styles.logCard}>
            <form className={styles.logForm} onSubmit={handleSubmit} noValidate>
              <header className={styles.logHeader}>
              <h2 id="time-entry-heading">時間記録</h2>
              <TextField
                id="work-date"
                label="日付"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </header>

            {message ? (
              <div className={styles.feedback} role="status" aria-live="polite">
                {message}
              </div>
            ) : null}

            {!isLeave || leaveType !== "full" ? (
              <div className={styles.workItems}>
                {workItems.map((item, index) => (
                  <div key={item.id} className={styles.workRow} data-testid="work-row">
                    <div className={styles.workRowFields}>
                      <SelectField
                        id={`department-${item.id}`}
                        label="大分類"
                        options={departmentOptions}
                        value={item.department}
                        onChange={(event) => updateWorkItem(item.id, "department", event.target.value)}
                      />
                      <SelectField
                        id={`project-${item.id}`}
                        label="中分類"
                        options={projectOptions}
                        value={item.project}
                        onChange={(event) => updateWorkItem(item.id, "project", event.target.value)}
                      />
                      <SelectField
                        id={`task-${item.id}`}
                        label="小分類"
                        options={taskOptions}
                        value={item.task}
                        onChange={(event) => updateWorkItem(item.id, "task", event.target.value)}
                      />
                      <TextField
                        id={`hours-${item.id}`}
                        label="時間"
                        type="number"
                        min="0"
                        max="24"
                        step="0.25"
                        inputMode="decimal"
                        value={item.hours}
                        onChange={(event) => updateWorkItem(item.id, "hours", event.target.value)}
                        onBlur={(event) => handleHoursChange(item.id, event.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className={styles.removeButton}
                      iconOnly
                      aria-label={`作業項目 ${index + 1} を削除`}
                      onClick={() => removeWorkItem(item.id)}
                      disabled={workItems.length === 1}
                    >
                      <span className={styles.removeIcon} aria-hidden />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.leaveNotice}>全休を選択しているため、作業項目の入力は不要です。</p>
            )}

            {!isLeave || leaveType !== "full" ? (
              <div className={styles.addRowContainer}>
                <Button type="button" variant="secondary" onClick={addWorkItem}>
                  + 作業項目を追加
                </Button>
              </div>
            ) : null}

            <div className={styles.leaveSection}>
              <CheckboxField
                id="is-leave"
                label="休暇にする"
                checked={isLeave}
                onChange={(event) => handleLeaveToggle(event.target.checked)}
              />
              {isLeave ? (
                <div className={styles.leaveControls}>
                  <SelectField
                    id="leave-type"
                    label="休暇タイプ"
                    options={leaveTypeOptions}
                    value={leaveType}
                    onChange={(event) => handleLeaveTypeChange(event.target.value)}
                  />
                  {leaveType === "hourly" ? (
                    <TextField
                      id="leave-hours"
                      label="休暇時間"
                      type="number"
                      min="0"
                      max="7.5"
                      step="0.25"
                      inputMode="decimal"
                      value={hourlyLeaveHours}
                      onChange={(event) => setHourlyLeaveHours(event.target.value)}
                      onBlur={(event) => setHourlyLeaveHours(Number(event.target.value).toFixed(2))}
                      supportingText="0.25時間刻みで入力"
                    />
                  ) : null}
                </div>
              ) : null}
            </div>

            <Card spacing="section" className={styles.summaryCard} role="region" aria-labelledby="summary-heading">
              <h3 id="summary-heading">自動計算結果</h3>
              <dl className={styles.summaryGrid}>
                <div>
                  <dt>総作業時間</dt>
                  <dd>{summary.workHours.toFixed(2)} h</dd>
                </div>
                <div>
                  <dt>休暇時間</dt>
                  <dd>{summary.leaveHours.toFixed(2)} h</dd>
                </div>
                <div>
                  <dt>合計稼働時間</dt>
                  <dd>{summary.totalHours.toFixed(2)} h</dd>
                </div>
                <div>
                  <dt>休憩時間</dt>
                  <dd>{summary.breakHours.toFixed(2)} h</dd>
                </div>
                <div>
                  <dt>始業時間</dt>
                  <dd>{summary.startTime}</dd>
                </div>
                <div>
                  <dt>終業時間</dt>
                  <dd>{summary.endTime}</dd>
                </div>
                <div>
                  <dt>残業時間</dt>
                  <dd>{summary.overtime.toFixed(2)} h</dd>
                </div>
                <div>
                  <dt>深夜残業時間</dt>
                  <dd>{summary.midnightOvertime.toFixed(2)} h</dd>
                </div>
              </dl>
            </Card>

            <div className={styles.actions}>
              <Button type="submit" variant="primary">
                保存
              </Button>
            </div>
            </form>
          </Card>
        </section>
      </main>
    </div>
  );
}
