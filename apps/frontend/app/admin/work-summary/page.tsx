"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  SelectField
} from "../../../path_to_your_design_system/components";
import { getCurrentCognitoSession } from "../../../lib/cognitoClient";
import { mainNavItems, type MainNavItemId } from "../../navItems";

type TimeGrouping = "daily" | "weekly" | "monthly";
type DimensionGrouping = "department" | "project" | "member";

type WorkEntry = {
  id: string;
  month: string;
  monthLabel: string;
  weekLabel: string;
  date: string;
  department: string;
  project: string;
  member: string;
  role: string;
  hours: number;
  overtimeHours: number;
  midnightHours: number;
};

const workEntries: WorkEntry[] = [
  {
    id: "2025-09-01-dev-01",
    month: "2025-09",
    monthLabel: "2025年9月",
    weekLabel: "第1週 (9/1-9/7)",
    date: "2025-09-01",
    department: "開発部",
    project: "Stamper開発",
    member: "宮里 康介",
    role: "フロントエンドエンジニア",
    hours: 7.5,
    overtimeHours: 0.5,
    midnightHours: 0
  },
  {
    id: "2025-09-02-dev-01",
    month: "2025-09",
    monthLabel: "2025年9月",
    weekLabel: "第1週 (9/1-9/7)",
    date: "2025-09-02",
    department: "開発部",
    project: "Stamper開発",
    member: "宮里 康介",
    role: "フロントエンドエンジニア",
    hours: 8.5,
    overtimeHours: 1,
    midnightHours: 0
  },
  {
    id: "2025-09-03-dev-02",
    month: "2025-09",
    monthLabel: "2025年9月",
    weekLabel: "第1週 (9/1-9/7)",
    date: "2025-09-03",
    department: "開発部",
    project: "Stamper開発",
    member: "佐藤 翔太",
    role: "バックエンドエンジニア",
    hours: 9,
    overtimeHours: 1.5,
    midnightHours: 0
  },
  {
    id: "2025-09-05-dev-02",
    month: "2025-09",
    monthLabel: "2025年9月",
    weekLabel: "第1週 (9/1-9/7)",
    date: "2025-09-05",
    department: "開発部",
    project: "OCR改善",
    member: "佐藤 翔太",
    role: "バックエンドエンジニア",
    hours: 10,
    overtimeHours: 2.5,
    midnightHours: 0.5
  },
  {
    id: "2025-09-08-dev-03",
    month: "2025-09",
    monthLabel: "2025年9月",
    weekLabel: "第2週 (9/8-9/14)",
    date: "2025-09-08",
    department: "開発部",
    project: "Stamper開発",
    member: "高橋 美咲",
    role: "UIデザイナー",
    hours: 7.5,
    overtimeHours: 0,
    midnightHours: 0
  },
  {
    id: "2025-09-10-dev-03",
    month: "2025-09",
    monthLabel: "2025年9月",
    weekLabel: "第2週 (9/8-9/14)",
    date: "2025-09-10",
    department: "開発部",
    project: "UI刷新",
    member: "高橋 美咲",
    role: "UIデザイナー",
    hours: 8,
    overtimeHours: 0.5,
    midnightHours: 0
  },
  {
    id: "2025-09-12-sales-01",
    month: "2025-09",
    monthLabel: "2025年9月",
    weekLabel: "第2週 (9/8-9/14)",
    date: "2025-09-12",
    department: "営業部",
    project: "クライアントA案件",
    member: "田中 一郎",
    role: "営業",
    hours: 7,
    overtimeHours: 0,
    midnightHours: 0
  },
  {
    id: "2025-09-16-sales-01",
    month: "2025-09",
    monthLabel: "2025年9月",
    weekLabel: "第3週 (9/15-9/21)",
    date: "2025-09-16",
    department: "営業部",
    project: "クライアントA案件",
    member: "田中 一郎",
    role: "営業",
    hours: 8,
    overtimeHours: 0.5,
    midnightHours: 0
  },
  {
    id: "2025-09-18-ops-01",
    month: "2025-09",
    monthLabel: "2025年9月",
    weekLabel: "第3週 (9/15-9/21)",
    date: "2025-09-18",
    department: "管理部",
    project: "勤怠運用",
    member: "山本 花",
    role: "人事",
    hours: 7.5,
    overtimeHours: 0,
    midnightHours: 0
  },
  {
    id: "2025-09-20-ops-01",
    month: "2025-09",
    monthLabel: "2025年9月",
    weekLabel: "第3週 (9/15-9/21)",
    date: "2025-09-20",
    department: "管理部",
    project: "勤怠運用",
    member: "山本 花",
    role: "人事",
    hours: 6.5,
    overtimeHours: 0,
    midnightHours: 0
  },
  {
    id: "2025-08-28-dev-01",
    month: "2025-08",
    monthLabel: "2025年8月",
    weekLabel: "第4週 (8/25-8/31)",
    date: "2025-08-28",
    department: "開発部",
    project: "Stamper開発",
    member: "宮里 康介",
    role: "フロントエンドエンジニア",
    hours: 8,
    overtimeHours: 0.5,
    midnightHours: 0
  },
  {
    id: "2025-08-30-sales-01",
    month: "2025-08",
    monthLabel: "2025年8月",
    weekLabel: "第5週 (8/29-9/4)",
    date: "2025-08-30",
    department: "営業部",
    project: "クライアントB案件",
    member: "田中 一郎",
    role: "営業",
    hours: 6.5,
    overtimeHours: 0,
    midnightHours: 0
  }
];

const toMonthOptions = (): Array<{ value: string; label: string }> => {
  const uniqueMonths = Array.from(
    new Map(workEntries.map((entry) => [entry.month, entry.monthLabel])).entries()
  );
  uniqueMonths.sort((a, b) => (a[0] > b[0] ? -1 : 1));
  return uniqueMonths.map(([value, label]) => ({ value, label }));
};

const buildOptions = (values: string[], prefix: string): Array<{ value: string; label: string }> => {
  return [{ value: "all", label: prefix }, ...values.map((value) => ({ value, label: value }))];
};

const monthOptions = toMonthOptions();
const departmentOptions = buildOptions(
  Array.from(new Set(workEntries.map((entry) => entry.department))).sort(),
  "全ての部署"
);
const projectOptions = buildOptions(
  Array.from(new Set(workEntries.map((entry) => entry.project))).sort(),
  "全てのプロジェクト"
);
const memberOptions = buildOptions(
  Array.from(new Set(workEntries.map((entry) => entry.member))).sort(),
  "全てのメンバー"
);

const timeGroupingOptions: Array<{ value: TimeGrouping; label: string }> = [
  { value: "daily", label: "日別" },
  { value: "weekly", label: "週別" },
  { value: "monthly", label: "月別" }
];

const dimensionOptions: Array<{ value: DimensionGrouping; label: string }> = [
  { value: "department", label: "部署別" },
  { value: "project", label: "プロジェクト別" },
  { value: "member", label: "メンバー別" }
];

type AggregatedRow = {
  key: string;
  label: string;
  totalHours: number;
  overtimeHours: number;
  midnightHours: number;
  recordCount: number;
  timeline: Array<{ label: string; hours: number }>;
};

const formatDate = (value: string) => {
  const instance = new Date(value);
  const month = String(instance.getMonth() + 1).padStart(2, "0");
  const day = String(instance.getDate()).padStart(2, "0");
  return `${month}/${day}`;
};

export default function WorkSummaryPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeNav, setActiveNav] = useState<MainNavItemId | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0]?.value ?? "2025-09");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [timeGrouping, setTimeGrouping] = useState<TimeGrouping>("weekly");
  const [dimensionGrouping, setDimensionGrouping] = useState<DimensionGrouping>("department");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
        console.warn("Failed to verify Cognito session on admin work summary", error);
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

  const filteredEntries = useMemo(() => {
    return workEntries.filter((entry) => {
      const matchesMonth = selectedMonth ? entry.month === selectedMonth : true;
      const matchesDepartment = selectedDepartment === "all" ? true : entry.department === selectedDepartment;
      const matchesProject = selectedProject === "all" ? true : entry.project === selectedProject;
      const matchesMember = selectedMember === "all" ? true : entry.member === selectedMember;
      return matchesMonth && matchesDepartment && matchesProject && matchesMember;
    });
  }, [selectedDepartment, selectedMember, selectedMonth, selectedProject]);

  const aggregatedRows = useMemo(() => {
    type InternalRow = AggregatedRow & {
      timelineMap: Map<string, { label: string; hours: number }>;
    };

    const map = new Map<string, InternalRow>();

    filteredEntries.forEach((entry) => {
      const dimensionKey =
        dimensionGrouping === "department"
          ? entry.department
          : dimensionGrouping === "project"
            ? entry.project
            : entry.member;

      const bucketKey =
        timeGrouping === "monthly"
          ? entry.month
          : timeGrouping === "weekly"
            ? entry.weekLabel
            : entry.date;

      const bucketLabel =
        timeGrouping === "monthly"
          ? entry.monthLabel
          : timeGrouping === "weekly"
            ? entry.weekLabel
            : `${formatDate(entry.date)}`;

      let record = map.get(dimensionKey);
      if (!record) {
        record = {
          key: dimensionKey,
          label: dimensionKey,
          totalHours: 0,
          overtimeHours: 0,
          midnightHours: 0,
          recordCount: 0,
          timeline: [],
          timelineMap: new Map<string, { label: string; hours: number }>()
        };
        map.set(dimensionKey, record);
      }

      record.totalHours += entry.hours;
      record.overtimeHours += entry.overtimeHours;
      record.midnightHours += entry.midnightHours;
      record.recordCount += 1;

      const existingBucket = record.timelineMap.get(bucketKey);
      if (existingBucket) {
        existingBucket.hours += entry.hours;
      } else {
        record.timelineMap.set(bucketKey, { label: bucketLabel, hours: entry.hours });
      }
    });

    return Array.from(map.values())
      .map((record) => ({
        key: record.key,
        label: record.label,
        totalHours: Number(record.totalHours.toFixed(2)),
        overtimeHours: Number(record.overtimeHours.toFixed(2)),
        midnightHours: Number(record.midnightHours.toFixed(2)),
        recordCount: record.recordCount,
        timeline: Array.from(record.timelineMap.values()).sort((a, b) => a.label.localeCompare(b.label))
      }))
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [dimensionGrouping, filteredEntries, timeGrouping]);

  const summaryTotals = useMemo(() => {
    return filteredEntries.reduce(
      (acc, entry) => {
        acc.totalHours += entry.hours;
        acc.overtimeHours += entry.overtimeHours;
        acc.midnightHours += entry.midnightHours;
        return acc;
      },
      { totalHours: 0, overtimeHours: 0, midnightHours: 0 }
    );
  }, [filteredEntries]);

  const chartData = useMemo(() => {
    const data = aggregatedRows.slice(0, 6).map((row) => ({
      label: row.label,
      hours: row.totalHours
    }));
    const max = Math.max(...data.map((item) => item.hours), 0);
    return { data, max };
  }, [aggregatedRows]);

  const handleExportCsv = useCallback(() => {
    setStatusMessage("CSV出力は現在準備中です。フィルター条件を保持してエクスポート予定です。");
    setTimeout(() => setStatusMessage(null), 3200);
  }, []);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-12 md:px-12">
      <span className="self-start rounded-[var(--radius-xl)] border border-border-strong bg-surface-contrast px-3 py-1 text-sm font-medium text-brand-primary">
        WorkSummaryPage
      </span>
      <main className="w-full max-w-6xl rounded-[var(--radius-xl)] bg-surface-shell p-10 shadow-elevated">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">管理者</p>
            <h1 className="text-2xl font-bold text-text-primary">作業時間集計ダッシュボード</h1>
            <p className="text-sm text-text-secondary">
              部署やプロジェクト横断での勤務時間を集計し、時間帯別の稼働状況を把握できます。フィルターを組み合わせてチームの利用状況を分析してください。
            </p>
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

        {statusMessage ? (
          <div
            className="mt-8 rounded-[var(--radius-md)] border border-brand-secondary/40 bg-brand-secondary/10 px-4 py-3 text-sm text-brand-secondary"
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </div>
        ) : null}

        <section className="mt-10 flex flex-col gap-6" aria-labelledby="filters-heading">
          <div className="flex flex-wrap items-end gap-4" role="group" aria-labelledby="filters-heading">
            <div className="space-y-2">
              <h2 id="filters-heading" className="text-xl font-semibold text-text-primary">
                集計条件
              </h2>
              <p className="text-sm text-text-secondary">
                月度・部署・プロジェクト・メンバーの条件を組み合わせて集計範囲を絞り込みます。
              </p>
            </div>
            <div className="flex flex-1 flex-wrap gap-4 md:justify-end">
              <SelectField
                id="filter-month"
                label="対象月"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                options={monthOptions}
                className="min-w-[200px]"
              />
              <SelectField
                id="filter-department"
                label="部署"
                value={selectedDepartment}
                onChange={(event) => setSelectedDepartment(event.target.value)}
                options={departmentOptions}
                className="min-w-[200px]"
              />
              <SelectField
                id="filter-project"
                label="プロジェクト"
                value={selectedProject}
                onChange={(event) => setSelectedProject(event.target.value)}
                options={projectOptions}
                className="min-w-[200px]"
              />
              <SelectField
                id="filter-member"
                label="メンバー"
                value={selectedMember}
                onChange={(event) => setSelectedMember(event.target.value)}
                options={memberOptions}
                className="min-w-[200px]"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="集計期間の切替">
              {timeGroupingOptions.map((option) => {
                const isActive = timeGrouping === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={isActive ? "primary" : "secondary"}
                    className="min-h-0 px-4 py-2 text-sm"
                    onClick={() => setTimeGrouping(option.value)}
                    aria-pressed={isActive}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="集計軸の切替">
              {dimensionOptions.map((option) => {
                const isActive = dimensionGrouping === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={isActive ? "primary" : "secondary"}
                    className="min-h-0 px-4 py-2 text-sm"
                    onClick={() => setDimensionGrouping(option.value)}
                    aria-pressed={isActive}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
            <Button type="button" variant="secondary" onClick={handleExportCsv}>
              CSV出力
            </Button>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3" aria-label="集計サマリー">
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">総稼働時間</p>
            <p className="font-mono text-2xl font-bold text-text-primary">
              {summaryTotals.totalHours.toFixed(1)}h
            </p>
          </Card>
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">残業時間</p>
            <p className="font-mono text-2xl font-bold text-text-primary">
              {summaryTotals.overtimeHours.toFixed(1)}h
            </p>
          </Card>
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">深夜残業</p>
            <p className="font-mono text-2xl font-bold text-text-primary">
              {summaryTotals.midnightHours.toFixed(1)}h
            </p>
          </Card>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]" aria-labelledby="chart-heading">
          <Card spacing="section" className="gap-6" role="region" aria-labelledby="chart-heading">
            <header className="flex items-center justify-between">
              <div>
                <h2 id="chart-heading" className="text-xl font-semibold text-text-primary">
                  稼働時間トップ {chartData.data.length} 件
                </h2>
                <p className="text-sm text-text-secondary">
                  選択した集計軸で稼働時間が多い順に表示しています。
                </p>
              </div>
              <span className="text-xs text-text-tertiary">最大値を100%として表示</span>
            </header>
            <div className="space-y-4">
              {chartData.data.length === 0 ? (
                <p className="rounded-[var(--radius-md)] bg-surface-muted px-4 py-3 text-sm text-text-secondary">
                  条件に一致する稼働データがありません。
                </p>
              ) : (
                chartData.data.map((item) => {
                  const width = chartData.max > 0 ? Math.max(6, (item.hours / chartData.max) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-text-primary">{item.label}</span>
                        <span className="font-mono text-base text-text-primary">{item.hours.toFixed(1)}h</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-surface-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-dark"
                          style={{ width: `${width}%` }}
                          aria-hidden
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card spacing="section" className="gap-6" role="region" aria-labelledby="timeline-heading">
            <header>
              <h2 id="timeline-heading" className="text-xl font-semibold text-text-primary">
                時間推移サマリー
              </h2>
              <p className="text-sm text-text-secondary">
                選択した集計軸の先頭レコードについて、期間別の稼働推移を確認できます。
              </p>
            </header>
            {aggregatedRows.length === 0 ? (
              <p className="rounded-[var(--radius-md)] bg-surface-muted px-4 py-3 text-sm text-text-secondary">
                現在の条件に該当するデータがありません。
              </p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-primary/60 p-4">
                  <p className="text-sm font-semibold text-text-primary">{aggregatedRows[0].label}</p>
                  <p className="text-xs text-text-tertiary">
                    {timeGroupingOptions.find((option) => option.value === timeGrouping)?.label ?? ""}ごとの推移
                  </p>
                </div>
                <ul className="space-y-3">
                  {aggregatedRows[0].timeline.map((bucket) => (
                    <li key={`${aggregatedRows[0].key}-${bucket.label}`} className="flex items-center justify-between rounded-[var(--radius-md)] bg-surface-primary/70 px-4 py-3 text-sm">
                      <span className="text-text-secondary">{bucket.label}</span>
                      <span className="font-mono text-base font-semibold text-text-primary">{bucket.hours.toFixed(1)}h</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </section>

        <section className="mt-10 flex flex-col gap-6" aria-labelledby="table-heading">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 id="table-heading" className="text-xl font-semibold text-text-primary">
                集計結果一覧
              </h2>
              <p className="text-sm text-text-secondary">
                稼働時間、残業時間、深夜残業時間の合計とレコード数を表示します。平均稼働時間は対象期間の記録数で除算しています。
              </p>
            </div>
            <span className="text-xs text-text-tertiary">{aggregatedRows.length} 件表示</span>
          </div>

          <Card spacing="section" className="gap-6" role="region" aria-labelledby="table-heading">
            <div className="overflow-x-auto">
              <table className="min-w-[960px] border-separate border-spacing-0 text-left text-sm text-text-secondary">
                <thead className="bg-surface-muted/60 text-xs uppercase tracking-wide text-text-tertiary">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-text-secondary">対象</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">合計時間</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">残業</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">深夜残業</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">記録数</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">平均</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">期間別内訳</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-sm text-text-secondary">
                        条件に一致する集計結果がありません。
                      </td>
                    </tr>
                  ) : (
                    aggregatedRows.map((row) => (
                      <tr key={row.key} className="border-b border-border-subtle transition hover:bg-surface-muted/60">
                        <td className="px-4 py-3 font-semibold text-text-primary">{row.label}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-base font-semibold text-text-primary">
                          {row.totalHours.toFixed(1)}h
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-base text-text-primary">
                          {row.overtimeHours.toFixed(1)}h
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-base text-text-primary">
                          {row.midnightHours.toFixed(1)}h
                        </td>
                        <td className="px-4 py-3 font-mono text-base text-text-primary">{row.recordCount}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-base text-text-primary">
                          {row.recordCount > 0 ? (row.totalHours / row.recordCount).toFixed(1) : "-"}h
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary">
                          {row.timeline
                            .map((bucket) => `${bucket.label}: ${bucket.hours.toFixed(1)}h`)
                            .join(" / ")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
