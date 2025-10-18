"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent
} from "react";
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

type WorkItem = {
  id: string;
  department: string;
  project: string;
  task: string;
  hours: string;
};

type LeaveSelection = "none" | "full" | "hourly";

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
  leaveSelection: LeaveSelection,
  hourlyLeaveHours: string
): Summary => {
  const isLeave = leaveSelection !== "none";
  const isFullLeave = leaveSelection === "full";
  const workHours = isFullLeave
    ? 0
    : workItems.reduce((total, item) => total + clampNumber(item.hours), 0);
  const leaveHours =
    leaveSelection === "full"
      ? 7.5
      : leaveSelection === "hourly"
        ? clampNumber(hourlyLeaveHours)
        : 0;
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
  const defaultStartMinutes = day === 1 ? 9 * 60 : 9 * 60 + 30;
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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeNav, setActiveNav] = useState<MainNavItemId>("time-entry");
  const [workItems, setWorkItems] = useState<WorkItem[]>([createWorkItem(), createWorkItem(), createWorkItem()]);
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateForInput(new Date()));
  const [leaveSelection, setLeaveSelection] = useState<LeaveSelection>("none");
  const [hourlyLeaveHours, setHourlyLeaveHours] = useState("0.0");
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
      .catch((err) => {
        console.warn("Failed to verify Cognito session on time-entry", err);
        router.replace("/");
      });

    return () => {
      canceled = true;
    };
  }, [router]);

  const summary = useMemo(
    () => computeSummary(selectedDate, workItems, leaveSelection, hourlyLeaveHours),
    [hourlyLeaveHours, leaveSelection, selectedDate, workItems]
  );

  const handleNavClick = useCallback(
    (item: (typeof mainNavItems)[number]) => {
      setActiveNav(item.id);
      router.push(item.href);
    },
    [router]
  );

  const updateWorkItem = useCallback((id: string, key: keyof WorkItem, value: string) => {
    setWorkItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }, []);

  const handleHoursChange = useCallback((id: string, value: string) => {
    const sanitized = value === "" ? "" : Number(value).toFixed(2);
    setWorkItems((prev) => prev.map((item) => (item.id === id ? { ...item, hours: sanitized } : item)));
  }, []);

  const addWorkItem = useCallback(() => {
    setWorkItems((prev) => [...prev, createWorkItem()]);
  }, []);

  const removeWorkItem = useCallback((id: string) => {
    setWorkItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }, []);

  const handleFullLeaveChange = useCallback((checked: boolean) => {
    setLeaveSelection((prev) => {
      if (checked) return "full";
      return prev === "full" ? "none" : prev;
    });
    setMessage(null);
  }, []);

  const handleHourlyLeaveChange = useCallback((checked: boolean) => {
    setLeaveSelection((prev) => {
      if (checked) return "hourly";
      return prev === "hourly" ? "none" : prev;
    });
    setMessage(null);
  }, []);

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("日次記録を保存しました。");
    setTimeout(() => setMessage(null), 4000);
  }, []);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-12 md:px-12">
      <span className="self-start rounded-[var(--radius-xl)] border border-border-strong bg-surface-contrast px-3 py-1 text-sm font-medium text-brand-primary">
        TimeLogsPage
      </span>
      <main className="w-full max-w-5xl rounded-[var(--radius-xl)] bg-surface-shell p-10 shadow-elevated">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">勤怠管理</h1>
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

        <section className="mt-12 flex flex-col gap-8" aria-labelledby="time-entry-heading">
          <Card spacing="section" className="gap-8">
            <form className="flex flex-col gap-8" onSubmit={handleSubmit} noValidate>
              <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <h2 id="time-entry-heading" className="text-xl font-semibold text-text-primary">
                  時間記録
                </h2>
                <TextField
                  id="work-date"
                  label="日付"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full md:w-48"
                />
              </header>

              {message ? (
                <div
                  className="rounded-[var(--radius-md)] border border-brand-secondary/40 bg-brand-secondary/10 px-4 py-3 text-sm text-brand-secondary"
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </div>
              ) : null}

              {leaveSelection !== "full" ? (
                <div className="flex flex-col gap-6">
                  {workItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary/40 p-4 shadow-ambient lg:flex-row lg:items-start"
                      data-testid="work-row"
                    >
                      <div className="grid flex-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                        className="min-h-0 w-10 self-start border border-border-subtle bg-surface-primary p-2"
                        aria-label={`作業項目 ${index + 1} を削除`}
                        onClick={() => removeWorkItem(item.id)}
                        disabled={workItems.length === 1}
                      >
                        <svg
                          aria-hidden
                          className="h-4 w-4 text-brand-accent"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-[var(--radius-md)] bg-surface-muted px-4 py-3 text-sm text-text-secondary">
                  全休を選択しているため、作業項目の入力は不要です。
                </p>
              )}

              {leaveSelection !== "full" ? (
                <div className="flex justify-end">
                  <Button type="button" variant="secondary" onClick={addWorkItem}>
                    + 作業項目を追加
                  </Button>
                </div>
              ) : null}

              <div className="flex flex-col gap-4 border-t border-border-subtle pt-6">
                <h3 className="text-lg font-semibold text-text-primary">休暇設定</h3>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
                  <CheckboxField
                    id="leave-full"
                    label="全休 (7.5h)"
                    checked={leaveSelection === "full"}
                    onChange={(event) => handleFullLeaveChange(event.target.checked)}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <CheckboxField
                      id="leave-hourly"
                      label="時間休"
                      checked={leaveSelection === "hourly"}
                      onChange={(event) => handleHourlyLeaveChange(event.target.checked)}
                    />
                    <TextField
                      id="leave-hours"
                      label=""
                      type="number"
                      min="0"
                      max="7.5"
                      step="0.25"
                      inputMode="decimal"
                      value={hourlyLeaveHours}
                      onChange={(event) => setHourlyLeaveHours(event.target.value)}
                      onBlur={(event) => setHourlyLeaveHours(Number(event.target.value).toFixed(2))}
                      className="w-32 [&>label]:hidden"
                      disabled={leaveSelection !== "hourly"}
                      aria-label="時間休の取得時間"
                    />
                  </div>
                </div>
              </div>

              <Card spacing="section" role="region" aria-labelledby="summary-heading">
                <h3 id="summary-heading" className="text-lg font-semibold text-text-primary">
                  自動計算結果
                </h3>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <dt className="text-sm font-semibold text-text-tertiary">総作業時間</dt>
                    <dd className="text-base font-bold text-text-primary">{summary.workHours.toFixed(2)} h</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-sm font-semibold text-text-tertiary">休暇時間</dt>
                    <dd className="text-base font-bold text-text-primary">{summary.leaveHours.toFixed(2)} h</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-sm font-semibold text-text-tertiary">合計稼働時間</dt>
                    <dd className="text-base font-bold text-text-primary">{summary.totalHours.toFixed(2)} h</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-sm font-semibold text-text-tertiary">休憩時間</dt>
                    <dd className="text-base font-bold text-text-primary">{summary.breakHours.toFixed(2)} h</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-sm font-semibold text-text-tertiary">始業時間</dt>
                    <dd className="text-base font-bold text-text-primary">{summary.startTime}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-sm font-semibold text-text-tertiary">終業時間</dt>
                    <dd className="text-base font-bold text-text-primary">{summary.endTime}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-sm font-semibold text-text-tertiary">残業時間</dt>
                    <dd className="text-base font-bold text-text-primary">{summary.overtime.toFixed(2)} h</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-sm font-semibold text-text-tertiary">深夜残業時間</dt>
                    <dd className="text-base font-bold text-text-primary">{summary.midnightOvertime.toFixed(2)} h</dd>
                  </div>
                </dl>
              </Card>

              <div className="flex justify-end">
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
