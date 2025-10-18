"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ChangeEvent
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

type LeaveType = "full" | "hourly";

type WorkItem = {
  id: string;
  department: string;
  project: string;
  task: string;
  hours: string;
};

type DayRecord = {
  id: string;
  date: string;
  weekday: string;
  tasks: WorkItem[];
  isLeave: boolean;
  leaveType: LeaveType;
  leaveHours: string;
};

type EditingState = {
  index: number;
  draft: DayRecord;
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
  hours: "0.00"
});

const formatMonthLabel = (month: string) => {
  const [year, monthStr] = month.split("-");
  return `${Number(year)}年${Number(monthStr)}月`;
};

const parseHours = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatHoursValue = (value: string | number) => {
  const numeric = typeof value === "number" ? value : parseHours(value);
  return numeric.toFixed(2);
};

const initialRecords: DayRecord[] = [
  {
    id: "2025-09-01",
    date: "2025-09-01",
    weekday: "月",
    tasks: [
      {
        id: "task-1",
        department: "dev",
        project: "stamper",
        task: "planning",
        hours: "3.50"
      },
      {
        id: "task-2",
        department: "dev",
        project: "stamper",
        task: "design",
        hours: "4.00"
      }
    ],
    isLeave: false,
    leaveType: "full",
    leaveHours: "0.00"
  },
  {
    id: "2025-09-02",
    date: "2025-09-02",
    weekday: "火",
    tasks: [
      {
        id: "task-3",
        department: "dev",
        project: "stamper",
        task: "coding",
        hours: "6.25"
      }
    ],
    isLeave: true,
    leaveType: "hourly",
    leaveHours: "1.25"
  },
  {
    id: "2025-09-03",
    date: "2025-09-03",
    weekday: "水",
    tasks: [
      {
        id: "task-4",
        department: "dev",
        project: "stamper",
        task: "coding",
        hours: "7.50"
      }
    ],
    isLeave: false,
    leaveType: "full",
    leaveHours: "0.00"
  },
  {
    id: "2025-09-04",
    date: "2025-09-04",
    weekday: "木",
    tasks: [],
    isLeave: true,
    leaveType: "full",
    leaveHours: "7.50"
  },
  {
    id: "2025-09-05",
    date: "2025-09-05",
    weekday: "金",
    tasks: [
      {
        id: "task-5",
        department: "dev",
        project: "stamper",
        task: "testing",
        hours: "5.00"
      }
    ],
    isLeave: false,
    leaveType: "full",
    leaveHours: "0.00"
  }
];

const computeTotalHours = (record: DayRecord) => {
  if (record.isLeave && record.leaveType === "full") {
    return 7.5;
  }

  const taskHours = record.tasks.reduce((total, task) => total + parseHours(task.hours), 0);
  const leaveHours = record.isLeave && record.leaveType === "hourly" ? parseHours(record.leaveHours) : 0;
  return taskHours + leaveHours;
};

const formatDisplayDate = (date: string) => {
  const instance = new Date(date);
  const month = String(instance.getMonth() + 1).padStart(2, "0");
  const day = String(instance.getDate()).padStart(2, "0");
  return `${month}/${day}`;
};

const normalizeRecord = (draft: DayRecord): DayRecord => {
  const isFullLeave = draft.isLeave && draft.leaveType === "full";
  const sanitizedTasks = isFullLeave
    ? []
    : draft.tasks.map((task) => ({
        ...task,
        hours: formatHoursValue(task.hours)
      }));

  return {
    ...draft,
    tasks: sanitizedTasks,
    leaveHours: draft.isLeave && draft.leaveType === "hourly" ? formatHoursValue(draft.leaveHours) : isFullLeave ? "7.50" : "0.00"
  };
};

export default function BulkEditPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeNav, setActiveNav] = useState<MainNavItemId>("bulk-edit");
  const [records, setRecords] = useState<DayRecord[]>(initialRecords);
  const [selectedMonth] = useState("2025-09");
  const [editingState, setEditingState] = useState<EditingState | null>(null);
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
        console.warn("Failed to verify Cognito session on bulk-edit", error);
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

  const openEditDialog = useCallback(
    (index: number) => {
      setEditingState({
        index,
        draft: {
          ...records[index],
          tasks: records[index].tasks.map((task) => ({ ...task }))
        }
      });
    },
    [records]
  );

  const closeEditDialog = useCallback(() => {
    setEditingState(null);
  }, []);

  const handleDraftFieldChange = useCallback(
    <K extends keyof DayRecord>(key: K, value: DayRecord[K]) => {
      setEditingState((prev) => {
        if (!prev) return prev;

        if (key === "isLeave" && value === false && prev.draft.tasks.length === 0) {
          return {
            ...prev,
            draft: {
              ...prev.draft,
              isLeave: value as DayRecord["isLeave"],
              tasks: [createWorkItem()]
            }
          };
        }

        return {
          ...prev,
          draft: {
            ...prev.draft,
            [key]: value
          }
        };
      });
    },
    []
  );

  const handleDraftTaskChange = useCallback(
    (taskId: string, key: keyof WorkItem, value: WorkItem[typeof key]) => {
      setEditingState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          draft: {
            ...prev.draft,
            tasks: prev.draft.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    [key]: value
                  }
                : task
            )
          }
        };
      });
    },
    []
  );

  const addDraftTask = useCallback(() => {
    setEditingState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        draft: {
          ...prev.draft,
          tasks: [...prev.draft.tasks, createWorkItem()]
        }
      };
    });
  }, []);

  const removeDraftTask = useCallback((taskId: string) => {
    setEditingState((prev) => {
      if (!prev) return prev;
      if (prev.draft.tasks.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        draft: {
          ...prev.draft,
          tasks: prev.draft.tasks.filter((task) => task.id !== taskId)
        }
      };
    });
  }, []);

  const handleEditSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!editingState) return;

      const normalized = normalizeRecord(editingState.draft);

      setRecords((prev) =>
        prev.map((record, index) => (index === editingState.index ? normalized : record))
      );

      setMessage(`${formatDisplayDate(editingState.draft.date)} の記録を更新しました。`);
      setTimeout(() => setMessage(null), 4000);
      setEditingState(null);
    },
    [editingState]
  );

  const handleBulkSave = useCallback(() => {
    setMessage("月次の変更を保存しました。");
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const totalHoursByDay = useMemo(
    () => records.map((record) => computeTotalHours(record)),
    [records]
  );

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-12 md:px-12">
      <span className="self-start rounded-[var(--radius-xl)] border border-border-strong bg-surface-contrast px-3 py-1 text-sm font-medium text-brand-primary">
        BulkEditPage
      </span>
      <main className="w-full max-w-6xl rounded-[var(--radius-xl)] bg-surface-shell p-10 shadow-elevated">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">月次管理</p>
            <h1 className="text-2xl font-bold text-text-primary">月次一括編集</h1>
            <p className="text-sm text-text-secondary">{formatMonthLabel(selectedMonth)}</p>
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

        <section className="mt-10 flex flex-col gap-6" aria-labelledby="bulk-edit-table-heading">
          <Card spacing="section" className="gap-8" role="region" aria-labelledby="bulk-edit-table-heading">
            <div className="flex flex-col gap-2">
              <h2 id="bulk-edit-table-heading" className="text-xl font-semibold text-text-primary">
                勤怠データ一覧
              </h2>
              <p className="text-sm text-text-secondary">
                日別の作業記録と休暇情報をまとめて確認・編集できます。各行の「編集」ボタンから詳細を更新してください。
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[960px] border-separate border-spacing-0 text-left text-sm text-text-secondary">
                <thead className="bg-surface-muted/60 text-xs uppercase tracking-wide text-text-tertiary">
                  <tr>
                    <th className="sticky left-0 z-10 bg-surface-muted/60 px-4 py-3 font-semibold text-text-secondary">日付</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">曜日</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">記録された作業</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">合計時間</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => {
                    const totalHours = totalHoursByDay[index];
                    const hasTasks = record.tasks.length > 0;
                    return (
                      <tr
                        key={record.id}
                        className="border-b border-border-subtle transition hover:bg-surface-muted/60"
                      >
                        <td className="sticky left-0 z-[1] bg-surface-shell px-4 py-3 font-semibold text-text-primary">
                          {formatDisplayDate(record.date)}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{record.weekday}</td>
                        <td className="px-4 py-3 text-sm">
                          <ul className="space-y-1">
                            {record.isLeave ? (
                              <li className="font-semibold text-brand-accent">
                                {record.leaveType === "full"
                                  ? "(全休)"
                                  : `(時間休: ${formatHoursValue(record.leaveHours)}h)`}
                              </li>
                            ) : null}
                            {hasTasks
                              ? record.tasks.map((task) => (
                                  <li key={task.id} className="text-text-secondary">
                                    {task.department ? `${departmentOptions.find((opt) => opt.value === task.department)?.label ?? task.department}` : "未設定"}
                                    {" > "}
                                    {task.project ? `${projectOptions.find((opt) => opt.value === task.project)?.label ?? task.project}` : "未設定"}
                                    {" > "}
                                    {task.task ? `${taskOptions.find((opt) => opt.value === task.task)?.label ?? task.task}` : "未設定"}
                                    {`: ${formatHoursValue(task.hours)}h`}
                                  </li>
                                ))
                              : !record.isLeave ? (
                                  <li className="text-text-tertiary">作業記録はまだありません。</li>
                                ) : null}
                          </ul>
                        </td>
                        <td className="px-4 py-3 font-mono text-base font-semibold text-text-primary">
                          {totalHours.toFixed(2)}h
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            type="button"
                            variant="secondary"
                            className="min-h-0 px-4 py-2 text-sm"
                            onClick={() => openEditDialog(index)}
                          >
                            編集
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="primary" onClick={handleBulkSave}>
                一括保存
              </Button>
            </div>
          </Card>
        </section>
      </main>

      {editingState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-backdrop/80 backdrop-blur-sm px-6 py-12">
          <Card
            spacing="section"
            className="w-full max-w-3xl bg-surface-shell"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-edit-dialog-title"
          >
            <header className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">日次編集</p>
                <h3 id="bulk-edit-dialog-title" className="text-xl font-semibold text-text-primary">
                  {formatDisplayDate(editingState.draft.date)}（{editingState.draft.weekday}）
                </h3>
              </div>
              <Button type="button" variant="secondary" className="min-h-0 px-3 py-1 text-xs" onClick={closeEditDialog}>
                閉じる
              </Button>
            </header>
            <form className="flex flex-col gap-6" onSubmit={handleEditSubmit} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  id="edit-date"
                  label="日付"
                  type="date"
                  value={editingState.draft.date}
                  onChange={(event) => handleDraftFieldChange("date", event.target.value)}
                  className="w-full"
                />
                <TextField
                  id="edit-weekday"
                  label="曜日"
                  value={editingState.draft.weekday}
                  onChange={(event) => handleDraftFieldChange("weekday", event.target.value)}
                  className="w-full"
                />
              </div>
              <CheckboxField
                id="edit-is-leave"
                label="休暇にする"
                checked={editingState.draft.isLeave}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleDraftFieldChange("isLeave", event.target.checked)
                }
              />
              {editingState.draft.isLeave ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    id="edit-leave-type"
                    label="休暇タイプ"
                    options={leaveTypeOptions}
                    value={editingState.draft.leaveType}
                    onChange={(event) => handleDraftFieldChange("leaveType", event.target.value as LeaveType)}
                    className="w-full"
                  />
                  {editingState.draft.leaveType === "hourly" ? (
                    <TextField
                      id="edit-leave-hours"
                      label="休暇時間"
                      type="number"
                      min="0"
                      max="7.5"
                      step="0.25"
                      value={editingState.draft.leaveHours}
                      onChange={(event) => handleDraftFieldChange("leaveHours", event.target.value)}
                      supportingText="0.25時間刻みで入力"
                      className="w-full"
                    />
                  ) : null}
                </div>
              ) : null}

              {!(editingState.draft.isLeave && editingState.draft.leaveType === "full") ? (
                <div className="flex flex-col gap-4">
                  <h4 className="text-lg font-semibold text-text-primary">作業項目</h4>
                  <div className="flex flex-col gap-4">
                    {editingState.draft.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary/40 p-4 shadow-ambient lg:flex-row lg:items-start"
                      >
                        <div className="grid flex-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                          <SelectField
                            id={`edit-department-${task.id}`}
                            label="大分類"
                            options={departmentOptions}
                            value={task.department}
                            onChange={(event) => handleDraftTaskChange(task.id, "department", event.target.value)}
                          />
                          <SelectField
                            id={`edit-project-${task.id}`}
                            label="中分類"
                            options={projectOptions}
                            value={task.project}
                            onChange={(event) => handleDraftTaskChange(task.id, "project", event.target.value)}
                          />
                          <SelectField
                            id={`edit-task-${task.id}`}
                            label="小分類"
                            options={taskOptions}
                            value={task.task}
                            onChange={(event) => handleDraftTaskChange(task.id, "task", event.target.value)}
                          />
                          <TextField
                            id={`edit-hours-${task.id}`}
                            label="時間"
                            type="number"
                            min="0"
                            max="24"
                            step="0.25"
                            inputMode="decimal"
                            value={task.hours}
                            onChange={(event) => handleDraftTaskChange(task.id, "hours", event.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-0 w-10 self-start border border-border-subtle bg-surface-primary p-2"
                          onClick={() => removeDraftTask(task.id)}
                          disabled={editingState.draft.tasks.length === 1}
                          aria-label="作業項目を削除"
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
                  <div className="flex justify-end">
                    <Button type="button" variant="secondary" onClick={addDraftTask}>
                      + 作業項目を追加
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={closeEditDialog}>
                  キャンセル
                </Button>
                <Button type="submit" variant="primary">
                  保存
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
